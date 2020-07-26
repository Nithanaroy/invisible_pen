class Alert extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className={`alert alert-${this.props.type}`}>
                {this.props.content}
            </div>
        );
    }
}

export default Alert;