export default async function handler(req, res) {

```
// Разрешаем только POST
if (req.method !== "POST") {
    return res.status(405).json({
        success: false,
        error: "Method not allowed"
    });
}


try {

    // Получаем JSON
    const { text } = req.body || {};


    if (!text || typeof text !== "string") {
        return res.status(400).json({
            success: false,
            error: "Missing text parameter"
        });
    }


    // Переменные Vercel
    const TOKEN = process.env.VK_BOT_TOKEN;
    const USER_ID = process.env.VK_USER_ID;


    if (!TOKEN || !USER_ID) {

        console.error(
            "VK environment variables are missing"
        );

        return res.status(500).json({
            success: false,
            error:
                "VK_BOT_TOKEN or VK_USER_ID is not configured"
        });
    }


    // Параметры VK
    const params = new URLSearchParams();

    params.append(
        "access_token",
        TOKEN
    );

    params.append(
        "user_id",
        String(USER_ID)
    );

    params.append(
        "message",
        text
    );

    params.append(
        "random_id",
        String(
            Math.floor(
                Math.random() * 2147483647
            )
        )
    );

    params.append(
        "v",
        "5.199"
    );


    // Запрос к VK
    const response = await fetch(
        "https://api.vk.com/method/messages.send",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            body: params.toString()
        }
    );


    // Проверяем HTTP
    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "VK HTTP error:",
            response.status,
            errorText
        );

        return res.status(502).json({
            success: false,
            error:
                `VK HTTP error ${response.status}`
        });
    }


    const data =
        await response.json();


    // Ошибка VK API
    if (data.error) {

        console.error(
            "VK API error:",
            data.error
        );

        return res.status(400).json({

            success: false,

            error:
                data.error.error_msg ||
                "VK API error",

            error_code:
                data.error.error_code

        });
    }


    // Успешная отправка
    return res.status(200).json({

        success: true,

        result: data.response

    });


} catch (error) {

    console.error(
        "Server error:",
        error
    );

    return res.status(500).json({

        success: false,

        error:
            error?.message ||
            "Internal server error"

    });

}
```

}
