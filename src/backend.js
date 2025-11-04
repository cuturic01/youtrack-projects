exports.httpHandler = {
    endpoints: [
        {
            scope: 'global',
            method: 'GET',
            path: 'storage/:key',
            handle: function (ctx) {
                const key = ctx.request.parameters.key;
                const value = ctx.globalStorage.extensionProperties[key];
                ctx.response.json(value || null);
            }
        },
        {
            scope: 'global',
            method: 'POST',
            path: 'storage/:key',
            handle: function (ctx) {
                const key = ctx.request.parameters.key;
                const body = ctx.request.json();
                ctx.globalStorage.extensionProperties[key] = body;
                ctx.response.json({ success: true });
            }
        }
    ]
};