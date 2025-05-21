import { ApiResponseContent, requestOptions } from "./type";

import { paths } from "@/__generated__/schema";
import { ApiPathParameters, ApiQueryParameters, ApiRequestBody, OptionalizeNeverParameters } from "./type";
import { ApiPath } from "./type";
import { MethodKeys } from "./type";

/**
 * OpenAPIの定義をもとに型化したリクエストを行う
 * @param path エンドポイント
 * @param method HTTPメソッド
 * @param parameters 各パラメータ（パスパラメータ・クエリパラメータ・リクエストボディ）
 * @param options オプション
 * @returns　AxiosResponseを返す
 */
export const requestFigma = async <
	T extends ApiPath,
	M extends MethodKeys<paths[T]>,
>(
	path: T,
	method: M,
	parameters: OptionalizeNeverParameters<{
		query: ApiQueryParameters<paths[T], M>;
		path: ApiPathParameters<paths[T], M>;
		body: ApiRequestBody<paths[T], M>;
	}>,
	options: requestOptions = {},
) => {
	const FIGMA_BASE_URL = 'https://api.figma.com'
	let url: string = `${FIGMA_BASE_URL}${path}`;
	const body: Record<string, string | number | boolean | null> = {};
	const searchParams = new URLSearchParams();
  const { accessToken, ...fetchOptions } = options;

	// パスパラメータを設定
	if (
		typeof parameters === "object" &&
		"path" in parameters &&
		typeof parameters.path === "object" &&
		parameters.path
	) {
		for (const p of Object.entries(parameters.path)) {
			url = url.replaceAll(`{${p[0]}}`, p[1]);
		}
	}

	// クエリパラメータを設定
	if (
		typeof parameters === "object" &&
		"query" in parameters &&
		typeof parameters.query === "object" &&
		parameters.query
	) {
		for (const q of Object.entries(parameters.query)) {
			// 「q[1] === false」はfalseの値もparamsに含めるようにするため
			// nullやundefinedがリクエストに含まれないよう、0,falseのみ明示的に含める
			if (q[1] || typeof q[1] === "boolean" || typeof q[1] === "number") {
				searchParams.append(q[0], q[1].toString());
			}
		}
	}

	// リクエストボディを設定
	if (
		typeof parameters === "object" &&
		"body" in parameters &&
		typeof parameters.body === "object" &&
		parameters.body
	) {
		for (const p of Object.entries(parameters.body)) {
			// 「p[1] === false」はfalseの値もbodyに含めるようにするため
			// nullやundefinedがリクエストに含まれないよう、空文字、0,falseのみ明示的に含める
			if (
				p[1] ||
				typeof p[1] === "boolean" ||
				typeof p[1] === "number" ||
				typeof p[1] === "string"
			) {
				body[p[0]] = p[1];
			}
		}
	}

  const urlWithParams = `${url}?${searchParams.toString()}`
	console.log(urlWithParams)

	const response = await fetch(urlWithParams, {
    method,
    headers: {
      //"Content-Type": "application/json",
      //"Authorization": `Bearer ${options.accessToken}`,
			"X-FIGMA-TOKEN": process.env.FIGMA_ACCESS_TOKEN ?? ""
    },
    body: method === 'get' ? undefined : JSON.stringify(body),
    ...fetchOptions
  });

  const json = () => response.json() as Promise<ApiResponseContent<paths[T], M>>

	return {
    ...response,
    json
  }
};
