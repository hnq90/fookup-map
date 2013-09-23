<?php
include_once "header.php";
?>

<!DOCTYPE html>
<html ng-app>
<head>
<!--
This site was based on the Represent.LA project by:
- Alex Benzer (@abenzer)
- Tara Tiger Brown (@tara)
- Sean Bonner (@seanbonner)

Create a map for your startup community!
https://github.com/abenzer/represent-map
-->
<title><?= $title_tag ?></title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<meta charset="UTF-8">

<link href='http://fonts.googleapis.com/css?family=Open+Sans+Condensed:700|Open+Sans:400,700' rel='stylesheet' type='text/css'>
<link href="./bootstrap/css/bootstrap.css" rel="stylesheet" type="text/css" />
<link href="./bootstrap/css/bootstrap-responsive.css" rel="stylesheet" type="text/css" />
<link rel="stylesheet" href="map.css?nocache=289671982568" type="text/css" />
<link rel="stylesheet" media="only screen and (max-device-width: 480px)" href="mobile.css" type="text/css" />

<script src="./scripts/jquery-1.7.1.js" type="text/javascript" charset="utf-8"></script>
<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.0.7/angular.min.js"></script>
<script src="./bootstrap/js/bootstrap.js" type="text/javascript" charset="utf-8"></script>
<script src="./bootstrap/js/bootstrap-typeahead.js" type="text/javascript" charset="utf-8"></script>
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?sensor=false"></script>
<script type="text/javascript" src="./scripts/label.js"></script>
<script type="text/javascript" src="./csv2array.js"></script>

<script type="text/javascript">
var defaultLat = 1.349134;
var defaultLng = 103.817711;
</script>

<script type="text/javascript" src="./app.js"></script>

<? echo $head_html; ?>
</head>
<body ng-controller="FoodCtrl" ng-init="init()">

  <!-- display error overlay if something went wrong -->
  <?php echo $error; ?>

  <!-- facebook like button code -->
  <div id="fb-root"></div>
  <script>(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=421651897866629";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));</script>

  <!-- google map -->
  <div id="map_canvas"></div>

  <!-- topbar -->
  <div class="topbar" id="topbar">
    <div class="wrapper">
      <div class="right">
        <div class="share">
          <a href="https://twitter.com/share" class="twitter-share-button" data-url="<?= $domain ?>" data-text="<?= $twitter['share_text'] ?>" data-via="<?= $twitter['username'] ?>" data-count="none">Tweet</a>
          <script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
          <div class="fb-like" data-href="<?= $domain ?>" data-send="false" data-layout="button_count" data-width="100" data-show-faces="false" data-font="arial"></div>
        </div>
      </div>
      <div class="left">
        <div class="logo">
          <a href="./">
            <img src="images/logo.png" alt="" />
          </a>
        </div>
        <div class="buttons">
          <a href="#modal_info" class="btn btn-large btn-info" data-toggle="modal"><i class="icon-info-sign icon-white"></i>About this Map</a>
        </div>
        <div class="search">
          <input type="text" name="search" id="search" placeholder="Search for restaurants..." data-provide="typeahead" autocomplete="off" />
        </div>
      </div>
    </div>
  </div>

  <!-- right-side gutter -->
  <div class="menu" id="menu">
    <ul class="list" id="list">
      <li class='category' ng-repeat="type in types">
        <div class="category_item">
          <div class="category_toggle" onclick="toggle('{{type.id}}')" id="filter_{{type.id}}">&nbsp;
          </div>
          <a href='#' onclick="toggleList('{{type.id}}');" class='category_info'>
            <img src='./images/icons/{{type.id}}.png' alt='' />{{type.title}}
            <span class='total'>(100)</span>
          </a>
          <ul class='list-items list-{{type.id}}'>
            <li class='{{type.id}}' ng-repeat="item in restaurants | filter:{type: type.id}">
              <a href='#' onMouseOver="markerListMouseOver('{{item.id}}')" onMouseOut="markerListMouseOut('{{item.id}}')" onClick="goToMarker('{{item.id}}')">
                {{item.title}}
              </a>
            </li>
          </ul>
        </div>
      </li>
      <li class="blurb"><?= $blurb ?></li>
      <li class="attribution">
        <?=$attribution?>
      </li>
    </ul>
  </div>

  <!-- more info modal -->
  <div class="modal hide" id="modal_info">
    <div class="modal-header">
      <button type="button" class="close" data-dismiss="modal">×</button>
      <h3>About this Map</h3>
    </div>
    <div class="modal-body">
      <p>
        We built this map to connect and promote the tech startup community
        in our beloved Los Angeles. We've seeded the map but we need
        your help to keep it fresh. If you don't see your company, please
        <?php if($sg_enabled) { ?>
        <a href="#modal_add_choose" data-toggle="modal" data-dismiss="modal">submit it here</a>.
        <?php } else { ?>
        <a href="#modal_add" data-toggle="modal" data-dismiss="modal">submit it here</a>.
        <?php } ?>
        Let's put LA on the map together!
      </p>
      <p>
        Questions? Feedback? Connect with us: <a href="http://www.twitter.com/<?= $twitter['username'] ?>" target="_blank">@<?= $twitter['username'] ?></a>
      </p>
      <p>
        If you want to support the LA community by linking to this map from your website,
        here are some badges you might like to use. You can also grab the <a href="./images/badges/LA-icon.ai">LA icon AI file</a>.
      </p>
      <ul class="badges">
        <li>
          <img src="./images/badges/badge1.png" alt="">
        </li>
        <li>
          <img src="./images/badges/badge1_small.png" alt="">
        </li>
        <li>
          <img src="./images/badges/badge2.png" alt="">
        </li>
        <li>
          <img src="./images/badges/badge2_small.png" alt="">
        </li>
      </ul>
      <p>
        This map was built with <a href="https://github.com/abenzer/represent-map">RepresentMap</a> - an open source project we started
        to help startup communities around the world create their own maps.
        Check out some <a target="_blank" href="http://www.representmap.com">startup maps</a> built by other communities!
      </p>
    </div>
    <div class="modal-footer">
      <a href="#" class="btn" data-dismiss="modal" style="float: right;">Close</a>
    </div>
  </div>
</div>
</body>
</html>