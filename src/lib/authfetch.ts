import api from "./api";

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const method = init.method ?? "GET";
  const headers = init.headers;
  const body = init.body;

  const response = await api.request({
    url: String(input),
    method,
    headers,
    data: body,
  });

  return new Response(JSON.stringify(response.data), {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
