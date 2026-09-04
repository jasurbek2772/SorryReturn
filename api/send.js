```js
export default async function handler(req, res) {
    // Разрешаем только POST
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    try {
        // Vercel обычно уже парсит JSON в req.body
        const body = req.body || {};
        const text = body.text;

        // Проверяем сообщение
        if (typeof text !== "string" || !text.trim()) {
            return res.status(400).json({
                success: false,
                error: "Text is required"
            });
        }

        // Ограничиваем размер сообщения
        if (text.length > 4096) {
            return res.status(400).json({
                success: false,
                error: "Message is too long"
            });
        }

        // Переменные окружения Vercel
        const TOKEN = process.env.VK_BOT_TOKEN;
        const PEER_ID = process.env.VK_PEER_ID;

        if (!TOKEN || !PEER_ID) {
            console.error("VK environment variables are missing");

            return res.status(500).json({
                success: false,
                error: "VK server configuration error"
            });
        }

        // Формируем параметры VK API
        const params = new URLSearchParams();

        params.set("access_token", TOKEN);
        params.set("peer_id", String(PEER_ID));
        params.set("message", text.trim());
        params.set(
            "random_id",
            String(
                Math.floor(
                    Math.random() * 2147483647
                )
            )
        );
        params.set("v", "5.199");

        // Отправляем запрос в VK
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

        // Получаем ответ VK
        const data = await response.json();

        // HTTP-ошибка
        if (!response.ok) {
            console.error(
                "VK HTTP error:",
                response.status,
                data
            );

            return res.status(502).json({
                success: false,
                error: "VK request failed"
            });
        }

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
        console.log(
            "VK message sent:",
            data.response
        );

        return res.status(200).json({
            success: true,
            result: data.response
        });

    } catch (error) {
        console.error(
            "VK server error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}
```
