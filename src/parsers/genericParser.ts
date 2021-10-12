import { HTMLDocument } from "./imports.ts";
import { IParser } from "../types.ts";
import { trimSpaceAndNewLine } from "./helpers/stringHelper.ts";

const genericParser = (productId: string, priceId: string, altPriceId?: string): IParser =>
    async (doc: HTMLDocument | null): Promise<[item: string, priceString: string]> => {
    
        if (!doc)
            return ["", ""]

        const somePriceInfo = doc?.getElementById(priceId)?.innerText ?? doc?.getElementById(altPriceId ?? "")?.innerText;
        const item: string = trimSpaceAndNewLine(doc?.getElementById(productId)?.innerText ?? "");
        const priceString: string = trimSpaceAndNewLine(somePriceInfo ?? "");
        
        return [item, priceString]
    }

export {
    genericParser
}