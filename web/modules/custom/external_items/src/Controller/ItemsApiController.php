<?php

namespace Drupal\external_items\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\external_items\Service\CountriesGraphqlClient;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class ItemsApiController extends ControllerBase {

  public function __construct(
    private readonly CountriesGraphqlClient $client
  ) {}

  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('external_items.countries_client')
    );
  }

  public function list(Request $request): JsonResponse {
    $limit = max(1, min(50, (int) $request->query->get('limit', 12)));
    $page = max(1, (int) $request->query->get('page', 1));

    $query = <<<'GQL'
query CountriesList {
  countries {
    code
    name
    capital
    emoji
    continent { name }
    languages { code name }
  }
}
GQL;

    $res = $this->client->query($query);

    if (!$res['ok']) {
      return new JsonResponse([
        'ok' => FALSE,
        'error' => $res['error'] ?? 'Request failed',
      ], 502);
    }

    $all = $res['data']['countries'] ?? [];
    $total = count($all);

    if ($total === 0) {
      return new JsonResponse([
        'ok' => TRUE,
        'items' => [],
        'total' => 0,
        'page' => 1,
        'pages' => 1,
        'limit' => $limit,
      ]);
    }

    $pages = (int) ceil($total / $limit);
    $page = min($page, $pages);

    $offset = ($page - 1) * $limit;
    $items = array_slice($all, $offset, $limit);

    return new JsonResponse([
      'ok' => TRUE,
      'items' => $items,
      'total' => $total,
      'page' => $page,
      'pages' => $pages,
      'limit' => $limit,
    ]);
  }

  public function detail(string $id): JsonResponse {
    $id = strtoupper($id);

    $query = <<<'GQL'
query CountryDetail($code: ID!) {
  country(code: $code) {
    code
    name
    native
    capital
    currency
    emoji
    continent { name }
    languages { code name }
  }
}
GQL;

    $res = $this->client->query($query, ['code' => $id]);

    if (!$res['ok']) {
      return new JsonResponse([
        'ok' => FALSE,
        'error' => $res['error'] ?? 'Request failed',
      ], 502);
    }

    $item = $res['data']['country'] ?? NULL;

    if (!$item) {
      return new JsonResponse([
        'ok' => TRUE,
        'item' => NULL,
      ], 200);
    }

    return new JsonResponse([
      'ok' => TRUE,
      'item' => $item,
    ]);
  }

}
