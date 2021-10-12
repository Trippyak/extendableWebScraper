import { HTMLDocument } from "./imports.ts";
import { IParser } from "../types.ts";
import { trimSpaceAndNewLine } from "./helpers/stringHelper.ts";

const newEggParser: IParser = async (doc: HTMLDocument | null): Promise<[item: string, priceString: string]> => {
    
    if (!doc)
        return ["", ""]

    const itemH1 = doc?.getElementsByClassName("product-title")[0].innerHTML;
    const productPanes = doc?.getElementsByClassName("product-pane");
    const desiredPane = productPanes.filter(pane => !pane.className.includes("is-collapsed"))[0];
    const currentPriceBox = desiredPane.getElementsByClassName("price-current")[0];
    const item: string = trimSpaceAndNewLine(itemH1 ?? "");
    const priceString = trimSpaceAndNewLine(currentPriceBox.innerText ?? "");
    
    return [item, priceString]
}

export default newEggParser;