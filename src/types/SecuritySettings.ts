/**
 * @interface
 *
 * Security middleware settings.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface SecuritySettings {
  /**
   * URL pattern the authentication middleware is applied to.
   *
   * Empty disables the blanket check entirely, leaving each route to
   * authenticate itself.
   */
  urlPattern: string

  /**
   * Routes registered before authentication, and therefore reachable without
   * an API key.
   */
  publicRoutes: string[]

  /**
   * Paths exempt from the API-key check inside {@link urlPattern}.
   *
   * For endpoints that sit under the protected pattern but cannot be addressed
   * by key — a third-party webhook whose caller is someone else's service, and
   * which verifies its own signature or shared secret per route instead.
   * Unlike {@link publicRoutes}, these are real routes owned by a controller;
   * this only says the blanket check must not run on them.
   *
   * A trailing `/*` exempts a subtree, anything else exempts that one path.
   * Exact is the default because the two are different intents: a health check
   * mounted at the pattern's own prefix must stay open without opening
   * everything beneath it. Note that a pattern like `/api/v1/*` matches the
   * bare `/api/v1` as well, so a route there needs exempting explicitly.
   *
   * Empty by default: the pattern protects everything it covers unless a
   * deployment says otherwise.
   */
  excludedRoutes: string[]

  /**
   * Origins allowed to call this application from a browser.
   *
   * An empty list allows any origin, which is the right default for an API
   * addressed by key rather than by page. Naming origins switches on two things
   * at once: CORS is narrowed to them, and a request arriving with some other
   * `Origin` is rejected outright rather than merely being unreadable to the
   * page that sent it. The second half is what stops another site calling a
   * browser-facing endpoint and spending this application's upstream quota — CORS
   * alone would let the request through and only hide the response.
   *
   * Requests with no `Origin` header at all are unaffected: they are not
   * browsers, so there is no origin to police.
   */
  allowedOrigins: string[]
}
