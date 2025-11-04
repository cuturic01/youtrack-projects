exports.onInit = function (ctx) {
    const ext = ctx.globalStorage.extensionProperties;

    if (typeof ext.toggle === 'undefined') {
        ext.toggle = 'false';
        console.log('Initialized toggle to false');
    }
};

exports.httpHandler = {
    endpoints: [
        {
            scope: 'global',
            method: 'GET',
            path: 'toggle',
            handle: function (ctx) {
                try {
                    const ext = ctx.globalStorage.extensionProperties;

                    const toggle = ext.toggle === 'true';
                    ctx.response.json({ toggle });
                } catch (err) {
                    console.error('Error in GET /toggle:', err);
                    ctx.response.json({ toggle: false, error: err.message });
                }
            }
        },
        {
            scope: 'global',
            method: 'POST',
            path: 'toggle',
            handle: function (ctx) {
                try {
                    const body = ctx.request.json();
                    const stringValue = String(body);

                    ctx.globalStorage.extensionProperties.toggle = stringValue;
                    ctx.response.json({ toggle: body, message: 'Updated toggle' });

                    console.log('Updated toggle to', stringValue);
                } catch (err) {
                    console.error('Error in POST /toggle:', err);
                    ctx.response.json({ toggle: false, error: err.message });
                }
            }
        }
    ]
};
