angular.module('templates-app', ['graph/graph.tpl.html']);

angular.module("graph/graph.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("graph/graph.tpl.html",
    "<!-- BEGIN VISUALIZATION DIV -->\n" +
    "<div id=\"visualization\" class=\"fullwidth graph\">\n" +
    "  <div class=\"helpWrap\">\n" +
    "    <div class=\"helpbox\" ng-class=\"{showHelp : showHelp}\">\n" +
    "      <p>\n" +
    "        The visualization shows the current account being queried and\n" +
    "        each account that it is connected to via trust lines.  The arrows\n" +
    "        at the node indicate the direction of the trust line, and the width\n" +
    "        of the line indicates the relative size of the trust line balance.\n" +
    "\n" +
    "        Clicking on a node will set it as the current node, and its additional\n" +
    "        connections will be added to the chart. Live transactions will appear\n" +
    "        as colored lines moving between nodes on the visualization. The color\n" +
    "        of the line corresponds to the type of asset sent.\n" +
    "\n" +
    "        Selecting a currency from the dropdown will show 3 colors of nodes -\n" +
    "        red nodes have a negative balance and usually represent a gateway's wallet,\n" +
    "        gray nodes have no balance in the currency selected, and\n" +
    "        colored nodes have positive balances.\n" +
    "      </p>\n" +
    "      <p>\n" +
    "        At the bottom of the page, the table on the left shows all the balances\n" +
    "        by currency for the selected account. For currencies other than XRP, clicking\n" +
    "        on the balance will show the breakdown of each balance by trust lines for\n" +
    "        each currency. The table on the right shows the history of transactions\n" +
    "        for the selected account.\n" +
    "      </p>\n" +
    "\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "<!-- top bar -->\n" +
    "<div class=\"topbar\">\n" +
    "  <div class=\"centered\">\n" +
    "    <input id=\"focus\" type=\"text\"/>\n" +
    "    <!--<div id=\"currencySelect\">-->\n" +
    "      <!--<select id=\"currency\">-->\n" +
    "        <!--<option value=\"XRP\">All Currencies</option>-->\n" +
    "        <!--<option value=\"USD\">USD - U.S. Dollars</option>-->\n" +
    "        <!--<option value=\"EUR\">EUR - Euro</option>-->\n" +
    "        <!--<option value=\"CNY\">CNY - Chinese Yuan</option>-->\n" +
    "        <!--<option value=\"JPY\">JPY - Japanese Yen</option>-->\n" +
    "        <!--<option value=\"BTC\">BTC - Bitcoins</option>-->\n" +
    "        <!--<option value=\"___\">Other</option>-->\n" +
    "      <!--</select>-->\n" +
    "      <!--<input type=\"text\" id=\"otherCurrency\" value=\"other\" class=\"sbSelector sbHolder\" />-->\n" +
    "    <!--</div>-->\n" +
    "    <input id=\"searchButton\" type=\"button\" value=\"Go\"/>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"zoom\">\n" +
    "  <input type=\"button\" id=\"zoomOutButton\" value=\"&ndash;\"/>\n" +
    "  <input type=\"button\" id=\"zoomInButton\"  value=\"+\" disabled=\"disabled\"/>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"light large loading\" style=\"color:#aaa; position:absolute; width:100%; top:300px; line-height:50px; text-align:center;\">\n" +
    "  <img class=\"loader\" src=\"assets/images/rippleThrobber.png\" style=\"vertical-align: middle;\"/>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "</div><!-- END VISUALIZATION DIV -->\n" +
    "");
}]);
