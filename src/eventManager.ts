import { EventEmitter } from "https://deno.land/std@0.110.0/node/events.ts";

type action = (...args: any[]) => void;

type eventType = "error" | "message" | "productInfo" | "total";

class EventManager<EventType extends eventType> extends EventEmitter
{
    private _emitter: EventEmitter;

    constructor()
    {
        super();
        this._emitter = new EventEmitter();
    }

    // @ts-ignore
    public on(eventType: EventType, action: action)
    {
        this._emitter.on(eventType, action);
        return this;
    }

    public emit(eventType: EventType, ...data: any[])
    {
        return this._emitter.emit(eventType, ...data);
    }
}

export type {
    eventType
}

export {
    EventManager
}