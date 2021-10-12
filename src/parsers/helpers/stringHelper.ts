const trimSpaceAndNewLine = (str: string): string => {
    return str.trim().replace('\n', '');
}

export {
    trimSpaceAndNewLine
}