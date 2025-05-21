import type {
	HttpMethod as AllHttpMethod,
	ErrorStatus,
	OkStatus,
} from "openapi-typescript-helpers";
import type { components, paths } from "@/__generated__/schema"

type HttpMethod = Extract<
	AllHttpMethod,
	"get" | "delete" | "post" | "put" | "patch"
>;

/**IbaAPIのエンドポイント */
export type ApiPath = keyof paths;

/**特定のHTTPメソッドを持つエンドポイント */
export type MethodFilteredApiPath<M extends HttpMethod> = {
	[K in keyof paths]: paths[K][M] extends undefined ? never : K;
}[keyof paths];

// エンドポイントが受け付けるメソッド
export type MethodKeys<T> = {
	[K in Extract<keyof T, HttpMethod>]: T[K] extends undefined ? never : K;
}[Extract<keyof T, HttpMethod>];

/**エンドポイントのオペレーション */
export type ApiOperation<T, K extends Extract<keyof T, HttpMethod>> = T[K];

/**エンドポイントのパスパラメータ */
export type ApiPathParameters<
	T,
	K extends Extract<keyof T, HttpMethod>,
> = T[K] extends { parameters: { path: infer U } } ? U : never;

/**エンドポイントのクエリパラメータ */
export type ApiQueryParameters<
	T,
	K extends Extract<keyof T, HttpMethod>,
> = T[K] extends { parameters: { query?: infer U } }
	? U extends undefined
		? never
		: U
	: never;


/**エンドポイントのレスポンスコンテンツ */
export type ApiResponseContent<
	T,
	K extends Extract<keyof T, HttpMethod>,
	C extends OkStatus | ErrorStatus = OkStatus,
> = T[K] extends {
	responses: { [key in C]?: { content: { "application/json": infer U } } };
}
	? U
	: never;

/**エンドポイントのリクエストボディ */
export type ApiRequestBody<
	T,
	K extends Extract<keyof T, HttpMethod>,
> = T[K] extends {
	requestBody: { content: { "application/json": infer U } };
}
	? U
	: never;


/**valueがneverのキーを抽出する */
type NeverKey<T> = { [K in keyof T]: T[K] extends never ? K : never }[keyof T];

/**neverなパラメータをオプショナルにする */
export type OptionalizeNeverParameters<T> = OmitNeverParameters<T> & {
	[key in NeverKey<T>]?: never;
};
export type OmitNeverParameters<T> = Omit<T, NeverKey<T>>;


export type requestOptions = RequestInit & {
	/**アクセストークン。値が入っている場合、headerのAuthorization付与を行います。 */
	accessToken?: string;
};


/**OpenAPIで定義したSchemaの型 */
export type Schema<T extends keyof components["schemas"]> =
	components["schemas"][T];
