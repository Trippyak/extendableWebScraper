import { readJson } from "https://deno.land/x/jsonfile/mod.ts";
import { EventManager } from "../eventManager.ts";
import { timeScale, ISettings, Maybe, MaybeNotFound } from "../types.ts";
import {
    WrappedError
    , IFileNotFound
    , IUnsupportedTimeScale
    , IInversedTimeScale
    , IInversedTime
    , IMaxTimeExceeded
    , IParserNotAvailable
} from "../errors.ts";
import type { eventType } from "../eventManager.ts";


class FileNotFound extends WrappedError implements IFileNotFound
{
    private _fileName: string;
    public get fileName(): string
    {
        return this._fileName;
    }

    public errorType: "FileNotFound";
    
    constructor(fileName: string, message?: string)
    {
        const errorMessage = `File Not Found: ${fileName}`;
        const innerMessage = message ?? "";
        super(errorMessage, innerMessage)
        
        this._fileName = fileName;
        this.errorType = "FileNotFound";
    }
}

class UnsupportedTimeScale extends WrappedError implements IUnsupportedTimeScale
{
    private _timeScale: string;
    public get timeScale(): string
    {
        return this._timeScale;
    }

    public errorType: "UnsupportedTimeScale";

    constructor(timeScale: string, message?: string)
    {
        const errorMessage = `Unsupported Time Scale: ${timeScale}`;
        const innerMessage = message ?? "";
        super(errorMessage, innerMessage);
        this._timeScale = timeScale;
        this.errorType = "UnsupportedTimeScale";
    }
}

class InversedTimeScale extends WrappedError implements IInversedTimeScale
{
    private _pollTimeScale: string;
    private _cancelTimeScale: string;

    public get pollTimeScale(): string
    {
        return this._pollTimeScale;
    }

    public get cancelTimeScale(): string
    {
        return this._cancelTimeScale;
    }

    public errorType: "InversedTimeScale";

    constructor(pollTimeScale: string, cancelTimeScale: string, message?: string)
    {
        const errorMessage = `Inversed Time Scales:\nPoll Time Scale = ${pollTimeScale}\nCancel Time Scale = ${cancelTimeScale}`;
        const innerMessage = message ?? "";
        super(errorMessage, innerMessage);
        this._pollTimeScale = pollTimeScale;
        this._cancelTimeScale = cancelTimeScale;
        this.errorType = "InversedTimeScale";
    }
}

class InversedTime extends WrappedError implements IInversedTime
{
    private _pollTime: number;
    private _cancelTime: number;

    public get pollTime(): number
    {
        return this._pollTime;
    }

    public get cancelTime(): number
    {
        return this._cancelTime;
    }

    public errorType: "InversedTime";

    constructor(pollTime: number, cancelTime: number, message?: string)
    {
        const errorMessage = `Inversed Times:\nPoll Time: ${pollTime}\nCancel Time: ${cancelTime}`;
        const innerMessage = message ?? "";
        super(errorMessage, innerMessage);
        this._pollTime = pollTime;
        this._cancelTime = cancelTime;
        this.errorType = "InversedTime";
    }
}

class MaxTimeExceeded extends WrappedError implements IMaxTimeExceeded
{
    private _timeValue: number;
    private _timeScale: string;

    public get timeValue(): number
    {
        return this._timeValue;
    }

    public get timeScale(): string
    {
        return this._timeScale;
    }

    public errorType: "MaxTimeExceeded";

    constructor(timeValue: number, timeScale: string, message?: string)
    {
        const errorMessage = `Max Time Exceeded On Time ${timeValue} With Scale: ${timeScale}`;
        const innerMessage = message ?? "";
        super(errorMessage, innerMessage);
        this._timeValue = timeValue;
        this._timeScale = timeScale;
        this.errorType = "MaxTimeExceeded";
    }
}

class ParserNotAvailable extends WrappedError implements IParserNotAvailable
{
    private _parserName: string;
    public get parserName(): string
    {
        return this._parserName;
    }

    public errorType: "ParserNotAvailable";

    constructor(parserName: string, message?: string)
    {
        const errorMessage = `Unsupported Parser: ${parserName}`;
        const innerMessage = message ?? "";
        super(errorMessage, innerMessage);
        this._parserName = parserName;
        this.errorType = "ParserNotAvailable";
    }
}

type possibleError = IFileNotFound | IUnsupportedTimeScale | IInversedTimeScale | IInversedTime | IParserNotAvailable;

interface IRequiredSettings
{
    userSettings: string;
    timeScales: timeScale[]
    parsers: string [];
}

const buildTimeScaleMap = (timeScales: timeScale[]): Map<timeScale, number> => {
    const timeScaleMap = new Map<timeScale, number>();
    
    let i = 0;
    for (const scale of timeScales)
    {
        timeScaleMap.set(scale, i);
        i++;
    }
    
    return timeScaleMap;
}

const checkParserAvailability = async (settings: ISettings, requiredSettings: IRequiredSettings): Promise<MaybeNotFound<ISettings, string>>  => {
    const pageTypeSet = new Set<string>();
    const parserSet = new Set<string>();
    const {links} = settings;
    const {parsers} = requiredSettings;
    parsers.forEach(parser => parserSet.add(parser));
    links.forEach(link => pageTypeSet.add(link.pageType));

    for await (const pageType of pageTypeSet)
    {
        if (!parserSet.has(pageType))
            return pageType;
    }

    return settings;
}

const validateSettingsConfig = async (settings: ISettings, requiredSettings: IRequiredSettings): Promise<ISettings> => {
    let timeScaleMap: Map<timeScale, number> = buildTimeScaleMap(requiredSettings.timeScales);

    const {pollTime, cancelTime, cancelTimeBuffer} = settings;
    const {pollTimeScale, cancelTimeScale} = settings;
    const pollMagnitude = timeScaleMap.get(pollTimeScale) ?? -1;
    const cancelMagnitude = timeScaleMap.get(cancelTimeScale) ?? -1;
    let adjustedPollTime = -1;
    let adjustedCancelTime = -1;

    if (pollMagnitude === -1)
        throw new UnsupportedTimeScale(pollTimeScale);

    if (cancelMagnitude === -1)
        throw new UnsupportedTimeScale(cancelTimeScale);

    if (cancelMagnitude < pollMagnitude)
        throw new InversedTimeScale(pollTimeScale, cancelTimeScale)

    try
    {
        adjustedPollTime = adjustTime(pollTime, pollTimeScale);
    }
    catch(error)
    {
        throw new MaxTimeExceeded(pollTime, pollTimeScale, error.message);
    }

    try
    {
        adjustedCancelTime = adjustTime(cancelTime, cancelTimeScale, cancelTimeBuffer);
    }
    catch(error)
    {
        throw new MaxTimeExceeded(cancelTime, cancelTimeScale, error.message);
    }

    if (adjustedPollTime > ((2**31)-1))
        throw new MaxTimeExceeded(pollTime, pollTimeScale);

    if (adjustedCancelTime > ((2**31)-1))
        throw new MaxTimeExceeded(cancelTime, cancelTimeScale);

    if (adjustedCancelTime < adjustedPollTime)
        throw new InversedTime(pollTime, cancelTime);

    const parserStatus = await checkParserAvailability(settings, requiredSettings);

    if (typeof parserStatus === "string" )
        throw new ParserNotAvailable(parserStatus);
    
    return settings;
}

const loadSettings = async (): Promise<[Maybe<ISettings>, Maybe<IRequiredSettings>]> => {
    let settings: ISettings;
    let requiredSettings: IRequiredSettings
    
    try
    {
        requiredSettings = await readJson("./src/settings/required.settings.json") as IRequiredSettings;
    }
    catch(error)
    {
        throw new FileNotFound("./required.settings.json");
    }

    try
    {
        settings = await readJson(requiredSettings.userSettings) as ISettings;
    }
    catch (err)
    {
        throw new FileNotFound(requiredSettings.userSettings);
    }

    return [await validateSettingsConfig(settings, requiredSettings), requiredSettings];
}

const adjustTime = (time: number, scale: timeScale, buffer: number = 0): number => {
    switch (scale)
    {
        case "millisecond":
            return time;
        case "second":
            return (time * 1000) + buffer;
        case "minute":
            return (time * 1000 * 60) + buffer;
        case "hour":
            return (time * 1000 * 60 * 60) + buffer;
    }
}

const setupEventManager = (eventManager: EventManager<eventType>) =>{
    eventManager.on("error", (errorMessage: string) => console.log(errorMessage))
}

const loadConfigs = async (eventManager: EventManager<eventType>): Promise<[Maybe<ISettings>, Maybe<IRequiredSettings>]> => {
    let settings: Maybe<ISettings>; 
    let requiredSettings: Maybe<IRequiredSettings>;

    setupEventManager(eventManager);

    try
    {
        [settings, requiredSettings] = await loadSettings();

        if (settings === undefined || requiredSettings === undefined)
            return [undefined, undefined];

        const actionPollTime = adjustTime(settings.pollTime, settings.pollTimeScale as timeScale);
        const clearActionTime = adjustTime(settings.cancelTime
                                            , settings.cancelTimeScale as timeScale
                                            , settings.cancelTimeBuffer);
    
        settings.pollTime = actionPollTime;
        settings.cancelTime = clearActionTime;
        return [settings, requiredSettings];
    }
    catch(error)
    {
        const possibleError: possibleError = error;
        eventManager.emit("error", possibleError.message);
    }

    return [undefined, undefined];
}

export type {IRequiredSettings}

export {
    loadConfigs
}