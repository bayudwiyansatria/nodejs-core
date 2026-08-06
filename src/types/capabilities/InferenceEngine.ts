import { Capability } from '@/types/capabilities/Capability'

/**
 * @interface
 *
 * Text generation and embedding.
 *
 * @remarks
 * Which model answers is a configuration decision, not a call-site one, so the
 * model argument is optional everywhere and callers normally omit it. That is
 * what lets a deployment change models without touching a business service.
 *
 * Inference is expensive and frequently optional — an implementation whose
 * {@link Capability.isAvailable} is `false` should be checked before calling
 * rather than relied on to degrade, since there is no sensible empty answer to
 * a prompt.
 *
 * @typeParam TRuntime The runtime handle the engine is resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface InferenceEngine<TRuntime = unknown> extends Capability<TRuntime> {
  /**
   * Runs a prompt and returns the generated text.
   *
   * @param runtime The runtime handle.
   * @param prompt The prompt.
   * @param model Model to run. Falls back to the configured default.
   * @returns The generated text.
   */
  ask(runtime: TRuntime, prompt: string, model?: string): Promise<string>

  /**
   * Embeds text as a vector, for indexing or similarity search.
   *
   * @param runtime The runtime handle.
   * @param text The text to embed.
   * @param model Embedding model to run. Falls back to the configured default.
   * @returns The embedding.
   */
  embed(runtime: TRuntime, text: string, model?: string): Promise<number[]>
}
