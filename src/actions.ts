import { green, yellow } from "https://deno.land/std@0.110.0/fmt/colors.ts";
import { DOMParser } from "./parsers/imports.ts";
import { IRequiredSettings } from "./settings/settings.ts";
import { IParser, ILinkInfo } from "./types.ts";
import { cleanPrice } from "./helpers/stringHelpers.ts";
import { IInvalidLink, WrappedError } from "./errors.ts";
import { EventManager } from "./eventManager.ts";
import type { eventType } from "./eventManager.ts";

interface IParserDict
{
    [index: string]: IParser;
}

class InvalidLink extends WrappedError implements IInvalidLink
{
    private _link: string;

    public get link(): string
    {
        return this._link;
    }

    public errorType: "InvalidLink";

    constructor(link: string, message?: string)
    {
        const errorMessage = `Invalid Link: ${link}`;
        const innerMessage = message ?? "";
        super(errorMessage, innerMessage);
        this._link = link;
        this.errorType = "InvalidLink";
    }
}


type action = (...args: unknown[]) => void;

const loadParsers = async (requiredSettings: IRequiredSettings): Promise<IParserDict> => {
    const parsers: IParserDict = {};

    for (const parserString of requiredSettings.parsers)
    {
        const mod = await import(`./parsers/${parserString}Parser.ts`);
        parsers[parserString] = mod.default;
    }

    return parsers;
}

const setupEventManager = (eventManager: EventManager<eventType>): void => {
    eventManager.on("productInfo", (item: string, priceString: string) => console.log(`${green("--")} ${item}: ${yellow(priceString)}`));
    eventManager.on("total", (total: number) => console.log(`Total: \$${green(`${total.toFixed(2)}`)}\n`));
}

const setupMoule = async (eventManager: EventManager<eventType>, requiredSettings: IRequiredSettings): Promise<[poll: action, cancel: action]> => {
    const parsers = await loadParsers(requiredSettings);

    setupEventManager(eventManager);

    const poll = async (...links: unknown[]) => {
        const domParser: DOMParser = new DOMParser();
        let total: number = 0;
        let link = "";
        for await (const linkInfo of links as ILinkInfo[])
        {
            const {pageType, url}: ILinkInfo = linkInfo;
    
            try
            {
                link = url;
                const response = await fetch(url, {
                    method: "GET"
                });
                const HTMLText = await response.text();
        
                const doc = domParser.parseFromString(HTMLText, "text/html");
                const parser = parsers[pageType];
                let [item, priceString] = await parser(doc);
                const price = parseFloat(cleanPrice(priceString));
                total += price;
        
                eventManager.emit("productInfo", item, priceString);
            }
            catch(error)
            {
                const invalidLink: any = new InvalidLink(link);
                eventManager.emit("error", invalidLink.message);
            }
        }
        
        eventManager.emit("total", total);
    }
    
    const cancel = (...args: unknown[]) => {
        const actionId = args[0] as number
        clearTimeout(actionId);
    }

    return [poll, cancel];
}

export {
    setupMoule
}