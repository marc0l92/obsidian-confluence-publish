export interface IConfluenceContent {
    id: string
    type: string
    title: string
    space: {
        key: string
    }
    ancestors: [{
        id: string
    }]
    body: {
        storage: {
            value: string
            representation: string
        }
    }
    version: {
        number: number
    }
    _links: {
        base: string
        webui: string
    }
}

export function createProxy<T extends object>(obj: T): T {
    const proxy = new Proxy<T>(obj, {
        get: (target: T, p: string, receiver: any) => {
            if (p in target) {
                const value = Reflect.get(target, p, receiver)
                if (value) {
                    if (value instanceof Object) {
                        return createProxy(value)
                    } else {
                        return value
                    }
                }
            }
            return ''
        },
    })
    return proxy
}