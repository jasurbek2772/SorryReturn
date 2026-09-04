export default async function handler(req, res) {

```
if (req.method !== 'POST') {
    return res.status(405).json({
        error: 'Method not allowed'
    });
}


const { text } = req.body || {};

if (!text) {
    return res.status(400).json({
        error: 'Missing text parameter'
    });
}


const TOKEN = process.env.VK_BOT_TOKEN;
const USER_ID = process.env.VK_USER_ID;


if (!TOKEN || !USER_ID) {
    return res.status(500).json({
        error: 'Server configuration error: missing VK tokens'
    });
}


try {

    const params = new URLSearchParams({

        access_token: TOKEN,

        user_id: USER_ID,

        message: text,

        random_id:
            String(
                Math.floor(
                    Math.random() * 2147483647
                )
            ),

        v: '5.131'

    });


    const response = await fetch(
        `https://api.vk.com/method/messages.send?${params.toString()}`,
        {
            method: 'POST'
        }
    );


    const data =
        await response.json();


    if (data.error) {

        return res.status(400).json({
            error: data.error.error_msg
        });

    }


    return res.status(200).json({

        success: true,

        result: data.response

    });


} catch (err) {

    return res.status(500).json({

        error: err.message

    });

}
```

}
