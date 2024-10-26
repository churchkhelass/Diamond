SELECT ts, high, low, high - low AS hl
FROM (
	SELECT toUInt64({date_start} + number*{granule}) AS ts
	FROM numbers(0,toUInt64(floor(({date_end}-{date_start})/{granule}))+1)
) AS n
ALL LEFT JOIN (
	SELECT toUInt64(ceil(tss/{granule}))*{granule} AS ts, MAX(phigh) AS high, MIN(plow) AS low
	FROM (
		SELECT ts AS tss, MAX(price) AS phigh, MIN(price) AS plow
		FROM (
			SELECT _timestamp AS ts, price
			FROM db_{base}_{quote}.tick_buy
			WHERE ts >= {date_start} AND ts < {date_end}
			UNION ALL SELECT _timestamp AS ts, price
			FROM db_{base}_{quote}.tick_sell
			WHERE ts >= {date_start} AND ts < {date_end}
		)
		GROUP BY tss
	)
	GROUP BY ts
) AS b USING (ts)
ORDER BY ts