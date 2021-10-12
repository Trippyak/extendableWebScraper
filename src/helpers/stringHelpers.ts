const cleanPrice = (str: string): string => {
    return str.substring(1).replace(',', '');
}

export {
    cleanPrice
}