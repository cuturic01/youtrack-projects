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
                    const version = Number(ext.version || 0);
                    const timestamp = Number(ext.timestamp || 0);
                    const clientId = ext.clientId || 'system';

                    ctx.response.json({
                        toggle,
                        version,
                        timestamp,
                        clientId
                    });
                } catch (err) {
                    console.error('Error in GET /toggle:', err);
                    ctx.response.status = 500;
                    ctx.response.json({
                        error: 'Failed to retrieve toggle state',
                        details: err.message
                    });
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

                    if (!body || typeof body.toggle !== 'boolean') {
                        ctx.response.status = 400;
                        ctx.response.json({
                            error: 'Invalid request',
                            details: 'Body must contain boolean "toggle" field'
                        });
                        return;
                    }

                    if (typeof body.expectedVersion !== 'number') {
                        ctx.response.status = 400;
                        ctx.response.json({
                            error: 'Invalid request',
                            details: 'Body must contain numeric "expectedVersion" field'
                        });
                        return;
                    }

                    if (!body.clientId || typeof body.clientId !== 'string') {
                        ctx.response.status = 400;
                        ctx.response.json({
                            error: 'Invalid request',
                            details: 'Body must contain string "clientId" field'
                        });
                        return;
                    }

                    const ext = ctx.globalStorage.extensionProperties;

                    const currentVersion = Number(ext.version || 0);
                    const expectedVersion = Number(body.expectedVersion);

                    if (expectedVersion !== currentVersion) {
                        console.log(
                            `Version conflict: expected ${expectedVersion}, current ${currentVersion}`
                        );

                        ctx.response.status = 409;
                        ctx.response.json({
                            conflict: true,
                            reason: 'version_mismatch',
                            expected: expectedVersion,
                            current: currentVersion,
                            latest: {
                                toggle: ext.toggle === 'true',
                                version: currentVersion,
                                timestamp: Number(ext.timestamp || 0),
                                clientId: ext.clientId || 'system'
                            },
                            message: 'State was modified by another client. Please refresh and try again.'
                        });
                        return;
                    }

                    const newVersion = currentVersion + 1;
                    const serverTimestamp = Date.now();

                    ext.toggle = String(body.toggle);
                    ext.version = String(newVersion);
                    ext.timestamp = String(serverTimestamp);
                    ext.clientId = body.clientId;

                    console.log(
                        `Toggle updated: ${body.toggle} by ${body.clientId} (v${currentVersion} → v${newVersion})`
                    );

                    ctx.response.json({
                        success: true,
                        toggle: body.toggle,
                        version: newVersion,
                        timestamp: serverTimestamp,
                        clientId: body.clientId,
                        message: 'Toggle updated successfully'
                    });

                } catch (err) {
                    console.error('Error in POST /toggle:', err);
                    ctx.response.status = 500;
                    ctx.response.json({
                        error: 'Failed to update toggle state',
                        details: err.message
                    });
                }
            }

        }
    ]
};
