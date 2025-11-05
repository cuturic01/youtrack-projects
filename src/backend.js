exports.httpHandler = {
    endpoints: [
        {
            scope: 'global',
            method: 'GET',
            path: 'toggle',
            handle: function (ctx) {
                try {
                    const ext = ctx.globalStorage.extensionProperties;
                    const toggle = ext.toggle ? ext.toggle === 'true' : false;
                    const timestamp = ext.timestamp ? Number(ext.timestamp) : 0;
                    const clientId = ext.clientId || 'system';

                    ctx.response.json({ toggle, timestamp, clientId });
                } catch (err) {
                    console.error('Error in GET /toggle:', err);
                    ctx.response.json({ error: err.error_description });
                }
            }
        },
        {
            scope: 'global',
            method: 'POST',
            path: 'toggle',
            handle: function (ctx) {
                try {
                    const body = JSON.parse(ctx.request.json());

                    if (!body) {
                        ctx.response.status = 400;
                        ctx.response.json({ error: 'Invalid request body' });
                        return;
                    }

                    const ext = ctx.globalStorage.extensionProperties;

                    const newTimestamp = Number(body.timestamp);
                    const newClientId = body.clientId;

                    const oldTimestamp = ext.timestamp ? Number(ext.timestamp) : 0;
                    const oldClientId = ext.clientId || 'system';

                    const isNewer =
                        newTimestamp > oldTimestamp ||
                        (newTimestamp === oldTimestamp && newClientId > oldClientId);

                    if (isNewer) {
                        ctx.globalStorage.extensionProperties.toggle = String(body.toggle);
                        ctx.globalStorage.extensionProperties.timestamp = String(newTimestamp);
                        ctx.globalStorage.extensionProperties.clientId = newClientId;

                        console.log(
                            `Accepted toggle update to ${ext.toggle} from ${newClientId} @ ${newTimestamp}`
                        );

                        ctx.response.json({
                            toggle: body.toggle,
                            timestamp: newTimestamp,
                            clientId: newClientId,
                            message: 'Update accepted'
                        });
                    } else {
                        console.log(`Rejected stale toggle update from ${newClientId}`);

                        ctx.response.status = 409;
                        ctx.response.json({
                            conflict: true,
                            reason: 'stale',
                            latest: {
                                toggle: ext.toggle === 'true',
                                timestamp: oldTimestamp,

                                newTimestamp: newTimestamp,
                                body: body,

                                clientId: oldClientId
                            }
                        });
                    }
                } catch (err) {
                    console.error('Error in POST /toggle:', err);
                    ctx.response.json({ error: err.error_description });
                }
            }
        }
    ]
};
