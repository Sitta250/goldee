https://classic.goldtraders.or.th/
use for latest current price on homepage. It shows the current date, time, and update count directly on the page. Right now the homepage shows “ประจำวันที่ 01/04/2569 เวลา 14:14 น. (ครั้งที่ 18)” with the current bar/jewelry prices.
https://classic.goldtraders.or.th/UpdatePriceList.aspx
use for intraday changes / history within the day. This is the page that lists each update time and update number for the day, for example on 01/04/2569 it shows entries from 09:03 (ครั้งที่ 1) through 13:47 (ครั้งที่ 17) with each price change row.
https://classic.goldtraders.or.th/DailyPrices.aspx
use for the official daily summary table, not the count of how many times the price changed. It shows the day’s official current table by product type, such as gold bar 96.5% and jewelry 96.5%, but it does not list the intraday sequence of changes.

So the clean architecture is:
homepage current price → homepage endpoint or latest row from your DB
intraday update tracking → UpdatePriceList.aspx
daily official reference table → DailyPrices.aspx