import { HTMLDocument } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";


type NotFound<U> = U;
type Maybe<T> = T | undefined;
type MaybeNotFound<T, U> = Maybe<T> | NotFound<U>;
type IParser = (doc: HTMLDocument | null) => Promise<[string, string]>;
type timeScale = "millisecond" | "second" | "minute" | "hour";
type parserType = "amazon" | "newegg";
type ILinkInfo = {pageType: parserType, url: string};

interface IParserDict
{
    [index: string]: IParser;
}

interface ISettings
{
    pollTime: number;
    cancelTime: number;
    cancelTimeBuffer: number;
    pollTimeScale: timeScale;
    cancelTimeScale: timeScale;
    timeScales: timeScale[];
    links: [ILinkInfo]
}

export type {
    NotFound
    , Maybe
    , MaybeNotFound
    , IParser
    , timeScale
    , parserType
    , ILinkInfo
    , IParserDict
    , ISettings
}