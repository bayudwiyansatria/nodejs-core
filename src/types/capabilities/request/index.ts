/**
 * @module
 *
 * What a runtime knows about a request that the request itself does not say.
 *
 * @remarks
 * {@link RequestMetadata} is the reader, {@link RequestFacts} is what it
 * returns, and the pair is worth having because which header may be believed is
 * a platform fact rather than a portable one. Concentrating that judgement in
 * one adapter per platform is what stops a caller reaching for the convenient
 * header and turning a portability problem into a security one.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export type { RequestMetadata } from '@/types/capabilities/request/RequestMetadata'

export type { RequestFacts } from '@/types/capabilities/request/RequestFacts'
