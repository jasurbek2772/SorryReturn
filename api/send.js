export default async function handler(req, res) {
    // Разрешаем только POST
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    try {
        const { text } = req.body || {};

        // Проверяем сообщение
        if (typeof text !== "string" || !text.trim()) {
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
                error: "Server configuration error"
            });
        }

        // Параметры VK API
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
            text.trim()
        );

        params.append(
            "random_id",
            String(
                Math.floor(
                    Math.random() * 2147483647
                )
            )
        );

        // Оставляем ту же версию, которая работает
        params.append(
            "v",
            "5.131"
        );

        // Запрос в VK
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
        const data =
            await response.json();

        // HTTP ошибка
        if (!response.ok) {
            console.error(
                "VK HTTP error:",
                response.status,
                data
            );

            return res.status(502).json({
                success: false,
                error: "VK HTTP error",
                status: response.status
            });
        }

        // Ошибка самого VK API
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

        // Всё успешно
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
}
