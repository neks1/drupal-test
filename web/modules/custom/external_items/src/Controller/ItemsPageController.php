<?php

namespace Drupal\external_items\Controller;

use Drupal\Core\Controller\ControllerBase;

final class ItemsPageController extends ControllerBase {

  public function listPage(): array {
    return [
      '#theme' => 'external_items_page',
      '#attached' => [
        'library' => [
          'external_items/items',
        ],
        'drupalSettings' => [
          'external_items' => [
            'mode' => 'list',
          ],
        ],
      ],
    ];
  }

  public function detailTitle(string $id): string {
    return "Item {$id}";
  }

  public function detailPage(string $id): array {
    return [
      '#theme' => 'external_item_detail_page',
      '#item_id' => $id,
      '#attached' => [
        'library' => [
          'external_items/items',
        ],
        'drupalSettings' => [
          'external_items' => [
            'mode' => 'detail',
            'id' => $id,
          ],
        ],
      ],
    ];
  }

}
