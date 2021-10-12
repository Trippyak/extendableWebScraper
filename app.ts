import { EventManager } from "./src/eventManager.ts";
import { loadConfigs } from "./src/settings/settings.ts";
import { setupMoule } from "./src/actions.ts";
import type { eventType } from "./src/eventManager.ts";

(async() => {
    const eventManager = new EventManager<eventType>();
    const [settings, requiredSettings] = await loadConfigs(eventManager);

    if (settings === undefined || requiredSettings === undefined)
        return;

    const [poll, cancel] = await setupMoule(eventManager, requiredSettings);
    const intervalId = setInterval(poll
        , settings.pollTime
        , ...settings.links);

    setTimeout(cancel, settings.cancelTime, intervalId);
})();