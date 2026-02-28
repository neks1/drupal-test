<?php

namespace Drupal\external_items\Service;

use GuzzleHttp\ClientInterface;

final class CountriesGraphqlClient {

  private const ENDPOINT = 'https://countries.trevorblades.com/';

  public function __construct(
    private readonly ClientInterface $httpClient
  ) {}

  /**
   * @return array{ok:bool,status:int,data?:array,error?:string}
   */
  public function query(string $query, array $variables = []): array {
    try {
      $res = $this->httpClient->request('POST', self::ENDPOINT, [
        'headers' => [
          'Content-Type' => 'application/json',
          'Accept' => 'application/json',
        ],
        'json' => [
          'query' => $query,
          'variables' => (object) $variables,
        ],
        'timeout' => 10,
      ]);

      $status = (int) $res->getStatusCode();
      $json = json_decode((string) $res->getBody(), TRUE);

      // GraphQL може повернути 200 навіть з errors.
      if (!empty($json['errors'])) {
        return [
          'ok' => FALSE,
          'status' => $status,
          'error' => $json['errors'][0]['message'] ?? 'GraphQL error',
        ];
      }

      return [
        'ok' => TRUE,
        'status' => $status,
        'data' => $json['data'] ?? [],
      ];
    }
    catch (\Throwable $e) {
      return [
        'ok' => FALSE,
        'status' => 500,
        'error' => $e->getMessage(),
      ];
    }
  }

}
