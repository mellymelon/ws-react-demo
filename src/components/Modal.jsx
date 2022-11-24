export default function Modal({ children,onTap }) {
    return <div className="modal" id="modal" onClick={ev => onTap(ev)}>
        {children}
    </div>
}