export default async function handler(req, res) {
    // Разрешаем preflight (на случай кросс-доменных запросов)
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        return res.status(200).end();
    }

    // Разрешаем только POST
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    try {
        // Vercel обычно сам парсит JSON body, но если по какой-то причине
        // req.body пустой (например, заголовок Content-Type не был передан) —
        // читаем и парсим тело вручную, чтобы запрос не терялся молча.
        let body = req.body;
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            const raw = await new Promise((resolve, reject) => {
                let data = "";
                req.on("data", chunk => (data += chunk));
                req.on("end", () => resolve(data));
                req.on("error", reject);
            });
            try {
                body = raw ? JSON.parse(raw) : {};
            } catch (e) {
                console.error("Body parse error:", e, "raw:", raw);
                body = {};
            }
        }

        const { text } = body || {};

        // Проверяем сообщение
        if (typeof text !== "string" || !text.trim()) {
            return res.status(400).json({
                success: false,
                error: "Missing text parameter"
            });
        }

        // Переменные окружения Vercel
        const TOKEN = process.env.VK_BOT_TOKEN;
        const USER_ID = process.env.VK_USER_ID;

        if (!TOKEN || !USER_ID) {
            console.error(
                "VK environment variables are missing: VK_BOT_TOKEN / VK_USER_ID"
            );
            return res.status(500).json({
                success: false,
                error: "Server configuration error: missing VK_BOT_TOKEN or VK_USER_ID"
            });
        }

        // Параметры VK API
        const params = new URLSearchParams();
        params.append("access_token", TOKEN);
        params.append("user_id", String(USER_ID));
        params.append("message", text.trim());
        params.append(
            "random_id",
            String(Math.floor(Math.random() * 2147483647))
        );
        params.append("v", "5.131");

        // Запрос в VK с таймаутом, чтобы функция не зависала
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        let response;
        try {
            response = await fetch(
                "https://api.vk.com/method/messages.send",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: params.toString(),
                    signal: controller.signal
                }
            );
        } finally {
            clearTimeout(timeout);
        }

        const data = await response.json().catch(() => null);

        // HTTP ошибка
        if (!response.ok) {
            console.error("VK HTTP error:", response.status, data);
            return res.status(502).json({
                success: false,
                error: "VK HTTP error",
                status: response.status
            });
        }

        // Ошибка самого VK API (неверный токен, чат не начат, бот заблокирован и т.д.)
        if (!data || data.error) {
            console.error("VK API error:", data && data.error);
            return res.status(400).json({
                success: false,
                error:
                    (data && data.error && data.error.error_msg) ||
                    "VK API error",
                error_code: data && data.error && data.error.error_code
            });
        }

        // Всё успешно
        console.log("VK message sent:", data.response);
        return res.status(200).json({
            success: true,
            result: data.response
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            error: error?.message || "Internal server error"
        });
    }
}
