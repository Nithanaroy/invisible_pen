class Alert extends React.Component {
    constructor(props) {
        super(props);
    }
    htmlContent(content) {
        return {__html: content};
    }
    render() {
        return (
            <div className={`alert alert-${this.props.type}`} dangerouslySetInnerHTML={this.htmlContent(this.props.content)} />
        );
    }
}

export default Alert;