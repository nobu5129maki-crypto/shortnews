<?php
// ログイン後のニュースAPI。公開RSSをPHPで読む。Node は使わない。

if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string) $_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store');
    exit;
}

require_once __DIR__ . '/auth.php';
ini_set('display_errors', '0');

if (!sn_logged_in()) {
    http_response_code(401);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo "ログインが必要です\n";
    exit;
}

function sn_news_fail($status, $error, $message)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(array(
        'error' => $error,
        'message' => $message,
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

function sn_genres_from_request()
{
    $out = array();
    if (!isset($_GET['g'])) {
        return $out;
    }
    $raw = $_GET['g'];
    $list = is_array($raw) ? $raw : array($raw);
    foreach ($list as $value) {
        $value = trim((string) $value);
        if ($value === '' || strlen($value) > 180) {
            continue;
        }
        if (preg_match('/[\r\n]/', $value)) {
            continue;
        }
        $out[] = $value;
        if (count($out) >= 4) {
            break;
        }
    }
    return $out;
}

function sn_plain($value, $limit)
{
    $text = strip_tags((string) $value);
    $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
    $replaced = preg_replace('/\s+/u', ' ', $text);
    if (is_string($replaced)) {
        $text = $replaced;
    }
    $text = trim($text);
    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $limit, 'UTF-8');
    }
    return substr($text, 0, $limit);
}

function sn_http_url($url)
{
    $url = trim((string) $url);
    if (preg_match('#^https://#i', $url)) {
        return $url;
    }
    return '';
}

function sn_search_label($genre)
{
    if (strpos($genre, 'search:') !== 0) {
        return '';
    }
    $raw = substr($genre, 7);
    $label = rawurldecode($raw);
    $label = trim($label);
    if (function_exists('mb_substr')) {
        return mb_substr($label, 0, 40, 'UTF-8');
    }
    return substr($label, 0, 40);
}

function sn_contains($haystack, $needle)
{
    if ($needle === '' || $haystack === '') {
        return false;
    }
    if (function_exists('mb_stripos')) {
        return mb_stripos($haystack, $needle, 0, 'UTF-8') !== false;
    }
    return strpos($haystack, $needle) !== false;
}

function sn_builtin_feeds($genre)
{
    $yahoo = 'https://news.yahoo.co.jp/rss/categories/';
    $map = array(
        'politics' => array(
            array($yahoo . 'domestic.xml', 'Yahoo!ニュース'),
            array('https://www.nhk.or.jp/rss/news/cat0.xml', 'NHK NEWS WEB'),
        ),
        'business' => array(
            array($yahoo . 'business.xml', 'Yahoo!ニュース'),
            array('https://rss.itmedia.co.jp/rss/2.0/business.xml', 'ITmedia ビジネス'),
        ),
        'tech' => array(
            array($yahoo . 'it.xml', 'Yahoo!ニュース'),
            array('https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml', 'ITmedia NEWS'),
        ),
        'ai' => array(
            array('https://rss.itmedia.co.jp/rss/2.0/aiplus.xml', 'ITmedia AI+'),
            array($yahoo . 'it.xml', 'Yahoo!ニュース'),
        ),
        'sports' => array(
            array($yahoo . 'sports.xml', 'Yahoo!ニュース'),
        ),
        'entertainment' => array(
            array($yahoo . 'entertainment.xml', 'Yahoo!ニュース'),
        ),
        'world' => array(
            array($yahoo . 'world.xml', 'Yahoo!ニュース'),
            array('https://feeds.bbci.co.uk/japanese/rss.xml', 'BBC News 日本語'),
        ),
        'science' => array(
            array($yahoo . 'science.xml', 'Yahoo!ニュース'),
        ),
        'life' => array(
            array($yahoo . 'life.xml', 'Yahoo!ニュース'),
        ),
    );
    if (isset($map[$genre])) {
        return $map[$genre];
    }
    return array(
        array($yahoo . 'domestic.xml', 'Yahoo!ニュース'),
        array('https://feeds.bbci.co.uk/japanese/rss.xml', 'BBC News 日本語'),
        array($yahoo . 'world.xml', 'Yahoo!ニュース'),
    );
}

function sn_curl_many($urls, $timeout)
{
    $bodies = array();
    $count = count($urls);
    for ($i = 0; $i < $count; $i++) {
        $bodies[$i] = '';
    }
    if ($count === 0) {
        return $bodies;
    }
    if (!function_exists('curl_multi_init')) {
        return $bodies;
    }
    $mh = curl_multi_init();
    if ($mh === false) {
        return $bodies;
    }
    $handles = array();
    foreach ($urls as $i => $url) {
        $ch = curl_init($url);
        if ($ch === false) {
            continue;
        }
        $opts = array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 2,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; MYLINE/1.0)',
            CURLOPT_HTTPHEADER => array('Accept: application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'),
            CURLOPT_ENCODING => '',
        );
        if (defined('CURLPROTO_HTTPS') && defined('CURLPROTO_HTTP')) {
            $opts[CURLOPT_PROTOCOLS] = CURLPROTO_HTTPS | CURLPROTO_HTTP;
            $opts[CURLOPT_REDIR_PROTOCOLS] = CURLPROTO_HTTPS | CURLPROTO_HTTP;
        }
        curl_setopt_array($ch, $opts);
        curl_multi_add_handle($mh, $ch);
        $handles[$i] = $ch;
    }
    $running = null;
    do {
        $status = curl_multi_exec($mh, $running);
        if ($running) {
            $selected = curl_multi_select($mh, 1.0);
            if ($selected === -1) {
                usleep(10000);
            }
        }
    } while ($running && $status === CURLM_OK);
    foreach ($handles as $i => $ch) {
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $body = curl_multi_getcontent($ch);
        if ($code >= 200 && $code < 300 && is_string($body) && strlen($body) > 0 && strlen($body) < 1500000) {
            $bodies[$i] = $body;
        }
        curl_multi_remove_handle($mh, $ch);
        curl_close($ch);
    }
    curl_multi_close($mh);
    return $bodies;
}

function sn_item_link($node)
{
    if (isset($node->link)) {
        $attrs = $node->link->attributes();
        if ($attrs && isset($attrs['href'])) {
            $href = sn_http_url((string) $attrs['href']);
            if ($href !== '') {
                return $href;
            }
        }
        $text = sn_http_url((string) $node->link);
        if ($text !== '') {
            return $text;
        }
    }
    if (isset($node->guid)) {
        return sn_http_url((string) $node->guid);
    }
    return '';
}

function sn_item_time($node)
{
    $raw = '';
    if (isset($node->pubDate)) {
        $raw = (string) $node->pubDate;
    } elseif (isset($node->published)) {
        $raw = (string) $node->published;
    } elseif (isset($node->updated)) {
        $raw = (string) $node->updated;
    }
    $ts = $raw !== '' ? strtotime($raw) : false;
    if ($ts === false) {
        $ts = time();
    }
    return gmdate('c', $ts);
}

function sn_item_poster($node)
{
    if (!isset($node->enclosure)) {
        return '';
    }
    $attrs = $node->enclosure->attributes();
    if (!$attrs || !isset($attrs['url'])) {
        return '';
    }
    $type = isset($attrs['type']) ? (string) $attrs['type'] : '';
    if ($type !== '' && strpos($type, 'image/') !== 0) {
        return '';
    }
    return sn_http_url((string) $attrs['url']);
}

function sn_parse_feed($xmlString, $sourceLabel, $genre)
{
    $items = array();
    if ($xmlString === '') {
        return $items;
    }
    if (PHP_VERSION_ID < 80000 && function_exists('libxml_disable_entity_loader')) {
        libxml_disable_entity_loader(true);
    }
    libxml_use_internal_errors(true);
    $flags = defined('LIBXML_NONET') ? LIBXML_NONET : 0;
    $xml = simplexml_load_string($xmlString, 'SimpleXMLElement', $flags);
    if ($xml === false) {
        return $items;
    }
    $nodes = array();
    if (isset($xml->channel->item)) {
        foreach ($xml->channel->item as $node) {
            $nodes[] = $node;
        }
    } elseif (isset($xml->item)) {
        foreach ($xml->item as $node) {
            $nodes[] = $node;
        }
    } elseif (isset($xml->entry)) {
        foreach ($xml->entry as $node) {
            $nodes[] = $node;
        }
    }
    $seen = 0;
    foreach ($nodes as $node) {
        if ($seen >= 24) {
            break;
        }
        $title = sn_plain(isset($node->title) ? $node->title : '', 180);
        $link = sn_item_link($node);
        if ($title === '' || $link === '') {
            continue;
        }
        $detail = '';
        if (isset($node->description)) {
            $detail = sn_plain($node->description, 1000);
        }
        if ($detail === '' && isset($node->summary)) {
            $detail = sn_plain($node->summary, 1000);
        }
        $summary = $detail;
        if (function_exists('mb_substr')) {
            $summary = mb_substr($detail, 0, 160, 'UTF-8');
        } else {
            $summary = substr($detail, 0, 160);
        }
        $items[] = array(
            'id' => 'live-' . substr(sha1($genre . '|' . $link), 0, 20),
            'genre' => $genre,
            'title' => $title,
            'summary' => $summary,
            'detail' => $detail !== '' ? $detail : $title,
            'keyPoints' => array(),
            'related' => array(),
            'source' => $sourceLabel,
            'publishedAt' => sn_item_time($node),
            'url' => $link,
            'videoUrl' => '',
            'posterUrl' => sn_item_poster($node),
            'likes' => 0,
            'comments' => 0,
        );
        $seen += 1;
    }
    return $items;
}

function sn_keep_matching($items, $label)
{
    if ($label === '') {
        return $items;
    }
    $matched = array();
    foreach ($items as $item) {
        $blob = $item['title'] . ' ' . $item['detail'];
        if (sn_contains($blob, $label)) {
            $matched[] = $item;
        }
    }
    return $matched;
}

function sn_prefer_ai($items)
{
    $words = array('AI', '人工知能', 'ChatGPT', '生成AI', 'LLM', 'Gemini', 'Claude', 'OpenAI');
    $preferred = array();
    foreach ($items as $item) {
        $blob = $item['title'] . ' ' . $item['detail'];
        foreach ($words as $word) {
            if (sn_contains($blob, $word)) {
                $preferred[] = $item;
                break;
            }
        }
    }
    if (count($preferred) >= 6) {
        return $preferred;
    }
    return $items;
}

function sn_unique_items($groups, $limit)
{
    $seenLink = array();
    $seenTitle = array();
    $out = array();
    foreach ($groups as $group) {
        foreach ($group as $item) {
            $titleKey = preg_replace('/\s+/u', '', $item['title']);
            if (!is_string($titleKey)) {
                $titleKey = $item['title'];
            }
            if (isset($seenLink[$item['url']]) || isset($seenTitle[$titleKey])) {
                continue;
            }
            $seenLink[$item['url']] = true;
            $seenTitle[$titleKey] = true;
            $out[] = $item;
            if (count($out) >= $limit) {
                return $out;
            }
        }
    }
    return $out;
}

function sn_collect_rss($genre)
{
    $feeds = sn_builtin_feeds($genre);
    $urls = array();
    $labels = array();
    foreach ($feeds as $feed) {
        $urls[] = $feed[0];
        $labels[] = $feed[1];
    }
    $bodies = sn_curl_many($urls, 8);
    $groups = array();
    foreach ($bodies as $i => $body) {
        $label = isset($labels[$i]) ? $labels[$i] : 'ニュース';
        $groups[] = sn_parse_feed($body, $label, $genre);
    }
    $items = sn_unique_items($groups, 20);
    $search = sn_search_label($genre);
    if ($search !== '') {
        $items = sn_keep_matching($items, $search);
    } elseif ($genre === 'ai') {
        $items = sn_prefer_ai($items);
    }
    return $items;
}

function sn_proxy_vercel($genre)
{
    if (!function_exists('curl_init')) {
        return array();
    }
    $url = 'https://shortnews-theta.vercel.app/api/news?g=' . rawurlencode($genre);
    $ch = curl_init($url);
    if ($ch === false) {
        return array();
    }
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 18,
        CURLOPT_USERAGENT => 'MYLINE-Xserver/1.0',
        CURLOPT_HTTPHEADER => array('Accept: application/json'),
    ));
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200 || !is_string($body) || $body === '') {
        return array();
    }
    $data = json_decode($body, true);
    if (!is_array($data) || !isset($data['items']) || !is_array($data['items'])) {
        return array();
    }
    $items = array();
    foreach ($data['items'] as $item) {
        if (!is_array($item) || !isset($item['title']) || !isset($item['id'])) {
            continue;
        }
        $item['genre'] = $genre;
        if (!isset($item['keyPoints']) || !is_array($item['keyPoints'])) {
            $item['keyPoints'] = array();
        }
        if (!isset($item['related']) || !is_array($item['related'])) {
            $item['related'] = array();
        }
        if (!isset($item['videoUrl'])) {
            $item['videoUrl'] = '';
        }
        if (!isset($item['detail'])) {
            $item['detail'] = isset($item['summary']) ? (string) $item['summary'] : (string) $item['title'];
        }
        $items[] = $item;
        if (count($items) >= 20) {
            break;
        }
    }
    return $items;
}

$genres = sn_genres_from_request();
if (count($genres) === 0) {
    sn_news_fail(400, 'genre_required', 'ジャンルを指定してください');
}

$collected = array();
foreach ($genres as $genre) {
    $items = sn_collect_rss($genre);
    if (count($items) < 2) {
        $fallback = sn_proxy_vercel($genre);
        if (count($fallback) > count($items)) {
            $items = $fallback;
        }
    }
    $collected[] = $items;
}
$merged = sn_unique_items($collected, 24);
if (count($merged) === 0) {
    sn_news_fail(502, 'news_fetch_failed', '最新ニュースの取得に失敗しました');
}

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
echo json_encode(array(
    'updatedAt' => gmdate('c'),
    'items' => $merged,
    'source' => 'live',
), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
