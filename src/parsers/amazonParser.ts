import { IParser } from "../types.ts";
import { genericParser } from "./genericParser.ts";

const amazonParser: IParser = genericParser("productTitle", "priceblock_ourprice", "priceblock_dealprice");

export default amazonParser;