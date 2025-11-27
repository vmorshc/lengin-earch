import {
  type DataTag,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  InfiniteData,
} from "@tanstack/react-query";

import type { ListPlacesEndpointPlacesGetParams } from "src/api/model/listPlacesEndpointPlacesGetParams";
import type { ResponseModelListPlace } from "src/api/model/responseModelListPlace";
import {
  listPlacesEndpointPlacesGet,
  type ListPlacesEndpointPlacesGetQueryError,
  type ListPlacesEndpointPlacesGetQueryResult,
} from "src/api/places/places";

const PLACES_PAGE_SIZE = 50;

type InfiniteListPlacesParams = Omit<
  ListPlacesEndpointPlacesGetParams,
  "limit" | "offset"
>;

type InfiniteListPlacesQueryKey = readonly [
  "infiniteListPlacesEndpointPlacesGet",
  InfiniteListPlacesParams,
];

type InfiniteListPlacesQueryOptions<TData, TError> = {
  query?: Partial<
    Omit<
      UseInfiniteQueryOptions<
        ListPlacesEndpointPlacesGetQueryResult,
        TError,
        TData,
        InfiniteListPlacesQueryKey,
        number
      >,
      "initialPageParam" | "queryKey" | "queryFn" | "getNextPageParam"
    >
  >;
  fetch?: RequestInit;
};

const isResponseModelListPlace = (
  data: ListPlacesEndpointPlacesGetQueryResult["data"],
): data is ResponseModelListPlace => {
  return Boolean(data) && typeof data === "object" && "payload" in data;
};

const getPayloadLength = (
  page: ListPlacesEndpointPlacesGetQueryResult,
): number => {
  if (!isResponseModelListPlace(page.data)) {
    return 0;
  }

  if (!Array.isArray(page.data.payload)) {
    return 0;
  }

  return page.data.payload.length;
};

export const getInfiniteListPlacesEndpointPlacesGetQueryKey = (
  params: InfiniteListPlacesParams,
): InfiniteListPlacesQueryKey => [
  "infiniteListPlacesEndpointPlacesGet",
  params,
];

export const getInfiniteListPlacesEndpointPlacesGetQueryOptions = <
  TData = ListPlacesEndpointPlacesGetQueryResult,
  TError = ListPlacesEndpointPlacesGetQueryError,
>(
  params: InfiniteListPlacesParams,
  options?: InfiniteListPlacesQueryOptions<TData, TError>,
) => {
  const { query: queryOptions, fetch: fetchOptions } = options ?? {};

  const queryKey = getInfiniteListPlacesEndpointPlacesGetQueryKey(
    params,
  ) as DataTag<InfiniteListPlacesQueryKey, TData, TError>;

  const queryFn: UseInfiniteQueryOptions<
    ListPlacesEndpointPlacesGetQueryResult,
    TError,
    TData,
    InfiniteListPlacesQueryKey,
    number
  >["queryFn"] = ({ pageParam = 0, signal }) =>
    listPlacesEndpointPlacesGet(
      { ...params, limit: PLACES_PAGE_SIZE, offset: pageParam },
      { ...fetchOptions, signal },
    );

  const getNextPageParam: UseInfiniteQueryOptions<
    ListPlacesEndpointPlacesGetQueryResult,
    TError,
    TData,
    InfiniteListPlacesQueryKey,
    number
  >["getNextPageParam"] = (lastPage, _allPages, lastPageParam = 0) => {
    const payloadLength = getPayloadLength(lastPage);

    if (payloadLength < PLACES_PAGE_SIZE) {
      return undefined;
    }

    return lastPageParam + payloadLength;
  };

  return {
    queryKey,
    queryFn,
    initialPageParam: 0,
    getNextPageParam,
    ...queryOptions,
  } as UseInfiniteQueryOptions<
    ListPlacesEndpointPlacesGetQueryResult,
    TError,
    TData,
    InfiniteListPlacesQueryKey,
    number
  > & { queryKey: DataTag<InfiniteListPlacesQueryKey, TData, TError> };
};

export function useInfiniteListPlacesEndpointPlacesGet<
  TData = ListPlacesEndpointPlacesGetQueryResult,
  TError = ListPlacesEndpointPlacesGetQueryError,
  TPageParam = number,
>(
  params: InfiniteListPlacesParams,
  options?: InfiniteListPlacesQueryOptions<TData, TError>,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<InfiniteData<TData, TPageParam>, TError> & {
  queryKey: DataTag<InfiniteListPlacesQueryKey, TData, TError>;
} {
  const queryOptions = getInfiniteListPlacesEndpointPlacesGetQueryOptions(
    params,
    options,
  );

  const query = useInfiniteQuery(queryOptions, queryClient);

  return {
    ...query,
    queryKey: queryOptions.queryKey,
  } as UseInfiniteQueryResult<InfiniteData<TData, TPageParam>, TError> & {
    queryKey: DataTag<InfiniteListPlacesQueryKey, TData, TError>;
  };
}
