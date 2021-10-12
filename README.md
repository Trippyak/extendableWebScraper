# Web Scraper

### Running Deno Script
```
deno run --allow-read --allow-net app.ts
```

### Compiling Deno Script
```
deno compile --allow-read --allow-net --output webScraper app.ts
```

### Running Executable
```
> webScraper.exe
$ ./WebScraper
```

### User Settings JSON Info
The user.settings.json file should be edited for typical use.
```
{
    "pollTime": 5
    , "cancelTime": 5
    , "cancelTimeBuffer": 100
    , "pollTimeScale": "millisecond" | "second" | "minute" | "hour"
    , "cancelTimeScale": "millisecond" | "second" | "minute" | "hour"
    , "links": [
        {
            "pageType": "amazon" | "newegg"
            , "url": ""
        }
    ]
}
```

pollTime and cancelTime + cancelTimeBuffer have a max of 2**31-1 or 2147483647.

Links can be amazon pages or newegg pages as pageType.

## Extending The Application
please refer to ./src/settings/required.settings.json and modify as needed.
```
{
    "userSettings": "./user.settings.json"
    , "timeScales": [
        "millisecond"
        , "second"
        , "minute"
        , "hour"
    ]
    , "parsers": [
        "amazon"
        , "newegg"
    ]
}
```

Typically leave userSettings alone.

Add a new time scale to timeScale to extend how long the app can run for.
Some foundational stuff would need to be added to handle items polling for over 2**31-1 milliseconds. Perhaps manager to do an an hourly proc to decrement one (1) hour each time and throws a cancel time out on max hours met for things like days and months.

Add new parsers by adding to parsers. Once in the setting file, add the new parser to ./src/parsers. Parser are loaded using the import() method. Parsers should have a definition of IParser
```
(doc: HTMLDocument | null): Promise<[item: string, priceString: string]>
```

Extend error handling / error messaging by adding interfaces to ./src/errors.ts

Extend types by adding types to ./src/types.ts