import { Capability } from '@/types/capabilities/Capability'
import type { StoredObject } from '@/types/capabilities/object/StoredObject'

/**
 * @interface
 *
 * Blob storage for files and payloads too large to sit in a row or a cache.
 *
 * @remarks
 * The body types are the Web-platform ones rather than anything vendor-specific,
 * which is what lets the same interface describe an edge object store and a
 * local filesystem stub without either having to translate.
 *
 * @typeParam TRuntime The runtime handle the store is resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ObjectStore<TRuntime = unknown> extends Capability<TRuntime> {
  /**
   * Stores an object.
   *
   * @param runtime The runtime handle.
   * @param key The object key.
   * @param body The object body.
   * @param contentType MIME type recorded on the object.
   * @returns The stored object's key and size.
   */
  upload(
    runtime: TRuntime,
    key: string,
    body: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
    contentType?: string
  ): Promise<StoredObject>

  /**
   * Stores a value as JSON.
   *
   * @param runtime The runtime handle.
   * @param key The object key.
   * @param value The value to serialise.
   * @returns The stored object's key and size.
   */
  uploadJson(runtime: TRuntime, key: string, value: unknown): Promise<StoredObject>

  /**
   * Reads an object as text.
   *
   * @param runtime The runtime handle.
   * @param key The object key.
   * @returns The body, or `null` when the object does not exist.
   */
  download(runtime: TRuntime, key: string): Promise<string | null>

  /**
   * Reads an object as JSON.
   *
   * @param runtime The runtime handle.
   * @param key The object key.
   * @returns The parsed value, or `null` when the object does not exist.
   */
  downloadJson<T = unknown>(runtime: TRuntime, key: string): Promise<T | null>

  /**
   * Reports whether an object exists, without transferring its body.
   *
   * @param runtime The runtime handle.
   * @param key The object key.
   * @returns `true` when the object is present.
   */
  exists(runtime: TRuntime, key: string): Promise<boolean>

  /**
   * Deletes one or more objects. Deleting an absent key is not an error.
   *
   * @param runtime The runtime handle.
   * @param keys The object key, or several of them.
   */
  remove(runtime: TRuntime, keys: string | string[]): Promise<void>

  /**
   * Lists the objects under a prefix.
   *
   * @param runtime The runtime handle.
   * @param prefix The key prefix to match.
   * @returns The matched objects.
   */
  list(runtime: TRuntime, prefix: string): Promise<StoredObject[]>
}
