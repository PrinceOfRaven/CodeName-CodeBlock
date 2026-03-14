import "./panel-block.css"

const PanelBlock = ({description, b_color, border_c, transfer, id}) => {
    return (
        <div
            className="block"
            key={id}
            draggable={true}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', transfer);
                e.currentTarget.classList.add('dragging');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('dragging');
            }}
            style={{
                backgroundColor: b_color,
                border: `2px solid ${border_c}`,
                width: "180px",      
            }}>
            <div className="block-text">
                <span>{description}</span>
            </div>
        </div>
    );
};

export default PanelBlock;