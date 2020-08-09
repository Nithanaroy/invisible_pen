class Alert extends React.Component {
    constructor(props) {
        super(props);
    }
    htmlContent(content, addDatePrefix=false) {
        let datePrefix = ""
        if(addDatePrefix) {
            const now = new Date();
            // datePrefix = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()} `
            datePrefix = `<strong>${now.toLocaleString()} </strong>`
            console.log(content);
        }
        return {__html: `${datePrefix}${content}`};
    }
    render() {
        return (
            <div className={`alert alert-${this.props.type}`} dangerouslySetInnerHTML={this.htmlContent(this.props.content)} />
        );
    }
}

export default Alert;