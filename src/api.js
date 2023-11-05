const API_KEY =
	'1d0ed17d0f842b76e54de749ff21c746b7e0d933a6c012c86e4e71a5dcd157d1'

const tickersHandlers = new Map()
const socket = new WebSocket(
	`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
)

const AGGREGATE_INDEX = '5'

socket.addEventListener('message', e => {
	const {
		TYPE: type,
		FROMSYMBOL: currency,
		PRICE: newPrice
	} = JSON.parse(e.data)
	if (type !== AGGREGATE_INDEX || newPrice === undefined) {
		return
	}

	const handlers = tickersHandlers.get(currency) ?? []
	handlers.forEach(fn => fn(newPrice))
})

function sendToWebSocket(message) {
	const stringifiedMessage = JSON.stringify(message)
	if (stringifiedMessage.readyState === WebSocket.OPEN) {
		socket.send(stringifiedMessage)
		return
	}

	socket.addEventListener(
		'open',
		() => {
			socket.send(stringifiedMessage)
		},
		{ once: true }
	)
}

function subscribeToTickerOnWs(ticker) {
	sendToWebSocket({
		action: 'SubAdd',
		subs: [`5~CCCAGG~${ticker}~USD`]
	})
}

function unsubscribeFromTickerOnWs(ticker) {
	sendToWebSocket({
		action: 'SubRemove',
		subs: [`5~CCCAGG~${ticker}~USD`]
	})
}

export const subscribeToTicker = (ticker, callback) => {
	const subscribers = tickersHandlers.get(ticker) || []
	tickersHandlers.set(ticker, [...subscribers, callback])
	subscribeToTickerOnWs(ticker)
}

export const unsubscribeFromTicker = ticker => {
	tickersHandlers.delete(ticker)
	unsubscribeFromTickerOnWs(ticker)
}

window.tickers = tickersHandlers
