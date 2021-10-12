interface IError
{
    errorType: string;
    message: string;
}

interface IFileNotFound extends IError
{
    errorType: "FileNotFound";
    fileName: string;
}

interface IUnsupportedTimeScale extends IError
{
    errorType: "UnsupportedTimeScale";
    timeScale: string;
}

interface IInversedTimeScale extends IError
{
    errorType: "InversedTimeScale";
    pollTimeScale: string;
    cancelTimeScale: string; 
}

interface IInversedTime extends IError
{
    errorType: "InversedTime";
    pollTime: number;
    cancelTime: number;
}

interface IMaxTimeExceeded extends IError
{
    errorType: "MaxTimeExceeded";
    timeValue: number;
    timeScale: string;
}

interface IParserNotAvailable extends IError
{
    errorType: "ParserNotAvailable";
    parserName: string;
}

interface IInvalidLink extends IError
{
    errorType: "InvalidLink";
    link: string;
}

class WrappedError extends Error
{
    protected _innerMessage: string;
    
    public get innerMessage(): string
    {
        return this._innerMessage;
    }

    constructor(message: string, innerMessage: string)
    {
        super(message);
        this._innerMessage = innerMessage;
    }
    
    public fullErrorStack(): string
    {
        return `${this.message}\nInner Exception:\n${this._innerMessage}`;
    }
}

export type {
    IError
    , IFileNotFound
    , IInversedTime
    , IInversedTimeScale
    , IMaxTimeExceeded
    , IParserNotAvailable
    , IUnsupportedTimeScale
    , IInvalidLink
}

export { WrappedError }