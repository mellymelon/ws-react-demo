import { useEffect, useState } from 'react'
import './App.scss'
import Modal from './components/Modal'

function SeatGrid({ uname, idx, onTap, isMySeat }) {

    return (
        <div className={`seat-grid ${uname.length > 0 && "active"} ${isMySeat && "my-seat"}`} onClick={() => onTap()}>
            {idx}
            {uname.length > 0 && <span>{uname}</span>}
        </div>
    )
}

const SEATS = 100
const CHECKIN_MODAL = 1, CHECKOUT_MODAL = 2, TAKEN_MODAL = 3, NO_DOUBLE = 4


const ws = new WebSocket(`ws://localhost:3000`) //dev环境用
const host = location.origin.replace(/^http/, 'ws')
// const ws = new WebSocket(host) //prod环境用
function App() {
    const [data, setData] = useState(new Array(SEATS).fill(""))
    const [connected, setConnected] = useState(false)
    const [curModal, setModal] = useState(-1)
    const [inpName, setName] = useState("")
    const [errMsg, setErrMsg] = useState("")
    const [idx, setIdx] = useState(-1) //追踪用户点击了哪个格
    const [curSeat, setCurSeat] = useState({ idx: -1, username: "" })

    function onGridTap(i) {
        setIdx(i)
        if (data[i].length > 0) {
            if (i == curSeat.idx) setModal(CHECKOUT_MODAL)
            else setModal(TAKEN_MODAL)
        }
        else if (curSeat.idx != -1) setModal(NO_DOUBLE)
        else setModal(CHECKIN_MODAL)
    }

    function closeModal(ev) {
        if (ev.target == document.getElementById("modal")) {
            setModal(-1)
            setErrMsg("")
        }
    }

    function cancel() {
        setModal(-1)
        setErrMsg("")
    }

    function confirm() {
        if (!inpName || !inpName.trim().length) setErrMsg("name cannot be empty")
        else if (data[idx].length > 0) {
            setErrMsg("sorry, the seat is already taken")
        } else {
            ws.send(`${idx}-${inpName}`)
            setModal(-1)
            setCurSeat({ idx, username: inpName })
            setName("")
            setErrMsg("")
        }
    }

    function checkout() {
        ws.send(`${idx}-`)
        setCurSeat({ idx: -1, username: '' })
        setModal(-1)
    }

    function onCheckin(uj) {
        const [i, name] = uj.split('-')
        setData(prevState => {
            const newState = [...prevState]
            newState[i] = name //如果是checkout，名字为空
            return newState
        })
    }

    useEffect(() => {
        ws.onopen = () => {
            setConnected(true)
            ws.onmessage = (ev) => {
                // console.log(`ws data received ${ev.data} ${Date.now()}`)
                if (ev.data.startsWith('[')) { //如果是数组，就初始化data
                    const A = JSON.parse(ev.data)
                    setData(A)
                }
                else onCheckin(ev.data) //否则更新checkin用户
            }
        }
        ws.onclose = () => {
            setConnected(false)
        }
    }, [])
    return (
        <div className="App">
            {!connected ? <h1>Connecting...</h1> : (
                <div>
                    {curModal != -1 &&
                        (curModal == CHECKIN_MODAL && <Modal onTap={ev => closeModal(ev)}>
                            <form className="modal-content">
                                <label htmlFor="uname">Please enter your name:</label>
                                <input type="text" autoFocus name="uname" value={inpName} onChange={e => setName(e.target.value)}></input>
                                <div className="err-msg">{errMsg}</div>
                                <button type="submit" onClick={ev => { ev.preventDefault(); confirm() }}>confirm</button>
                                <button type="button" onClick={() => cancel()}>cancel</button>
                            </form>
                        </Modal>) ||
                        (curModal == TAKEN_MODAL && <Modal onTap={ev => closeModal(ev)}>
                            <div className="modal-content">
                                <div className="err-msg">Sorry, the seat is already taken</div>
                                <button onClick={() => setModal(-1)}>confirm</button>
                            </div>
                        </Modal>) ||
                        (curModal == CHECKOUT_MODAL && <Modal onTap={ev => closeModal(ev)}>
                            <div className="modal-content">
                                <div>Do you want to check out?</div>
                                <button onClick={() => checkout()}>confirm</button>
                                <button onClick={() => setModal(-1)}>cancel</button>
                            </div>
                        </Modal>) ||
                        (curModal == NO_DOUBLE && <Modal onTap={ev => closeModal(ev)}>
                            <div className="modal-content">
                                <div className="err-msg">Sorry, you cannot check in multiple seats at the same time</div>
                                <button onClick={() => setModal(-1)}>confirm</button>
                            </div>
                        </Modal>)
                    }
                    <h1>{data.filter(el => el.length == 0).length} seats available</h1>
                    <div className="seats">
                        {data.map((name, i) => <SeatGrid uname={name} idx={i} key={`grid${i}`} onTap={() => onGridTap(i)} isMySeat={curSeat.idx == i} />)}
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
