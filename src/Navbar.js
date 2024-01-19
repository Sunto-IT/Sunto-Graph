import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import logosuntoit from './logo_sunto-it.svg';
import logo from './logo_publicxinversity.png';

import graph_download from './hierarchydata1.svg'
import graph_file from './suntograph_bra.nt';
import graph_png from './graph-full.png'


import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faProjectDiagram,
    faCog,
    faTable,
    faCircleMinus,
    faCirclePlus,
    faFileExport, faDownload, faUpload, faBook, faShieldHalved, faTrashCan, faArrowRotateRight, faUsers, faPrint
} from '@fortawesome/free-solid-svg-icons'
import Button from "react-bootstrap/Button";
import button from "bootstrap/js/src/button";
import React, {useState} from 'react';
import graphFile from './graph.json';
import import_vorlage_file from './import_vorlage.csv';

import {Alert, Card, Col, Form, InputGroup, Modal, Row} from "react-bootstrap";
import GraphManager from "./graph_manager.js";

// load graph data from file
let nodes = graphFile.nodes;
let edges = graphFile.edges;



class Menu extends React.Component {

    constructor(props) {
        // create an array with nodes
        super(props);
        this.state = {
            value: null,
            info: {
                'title': 'Informationen',
                'description': {'Hinweis': 'Um sich die Informationen zu einer Person, Institution oder Arbeitseinheit anzeigen zu lassen, wählen Sie diese innerhalb des Graphen durch einen Einfach-Klick auf das entsprechende Symbol aus. Die Informationen werden dann hier angezeigt.'}
            },
            logo: "",
            searchstring: "",
            searchresults: [],
            graphmanager: "",
            centerNodes: [],
            settings: {"include_direct_path": false, "include_1_hop": true, "include_above": false, "include_below": false, 'include_hierarchy': false},
            currentlyLargeNode: "",
            downloadurl: "initial",
            nutzer: "Administrator" // Administrator, Dezernatsleitung, Sachgebietsleitung, Sachbearbeiter
        };
        this.onGraphClick = this.onGraphClick.bind(this);
        this.onGraphDoubleClick = this.onGraphDoubleClick.bind(this);
        this.onSearchInput = this.onSearchInput.bind(this);
        this.onClickRemoveCenterNode = this.onClickRemoveCenterNode.bind(this);
        this.onClickAddCenterNode = this.onClickAddCenterNode.bind(this);
        this.update_search_results = this.update_search_results.bind(this);
        this.onSettingsChange = this.onSettingsChange.bind(this);
        this.onClickResetSearchString = this.onClickResetSearchString.bind(this);
        this.print = this.print.bind(this);
        this.handleuserchange = this.handleuserchange.bind(this);
    }

    componentDidMount() {
        // create a network
        var container = document.getElementById('mynetwork');
        var options = {"physics": {"enabled": true, "solver": 'repulsion'}};
        var data = {nodes: new window.vis.DataSet([]), edges: new window.vis.DataSet(edges)};

        var network = new window.vis.Network(container, data, options);

        // create graph manager
        var graph_manager = new GraphManager(nodes, edges, network, data);

        // debugging
        //graph_manager.dijkstra( "IRI Lindsay Davenport", "IRI Landesstelle schulische Integration Dez. 40");

        this.setState({graphmanager: graph_manager})

        // set on click on graph trigger
        network.on('click', this.onGraphClick);
        network.on('doubleClick', this.onGraphDoubleClick);
        var varout = "";


        network.on("afterDrawing", this.print)



        // on startup show all available nodes in the search
        var search_results = graph_manager.get_search_results("");
        this.setState({searchresults: search_results});
    }

    print(ctx){
        console.log(ctx);
        const link = document.createElement("a");
        link.id = "downloadbutton";
        console.log(this.state.downloadurl);
        let downloadurl = ctx.canvas.toDataURL();
        link.download = "filename";
        //link.click();
        //console.log(varout)
        this.setState({downloadurl:ctx});
        //console.log(varout)
    }

    onGraphDoubleClick(properties){
        var ids = properties.nodes;
        if (this.state.graphmanager.center_nodes.includes(this.state.graphmanager.get_node(ids[0])['iri'])){
            this.onClickRemoveCenterNode(this.state.graphmanager.get_node(ids[0])['iri'], null);
        }
        else{
            this.onClickAddCenterNode(this.state.graphmanager.get_node(ids[0])['iri'], null);
        }
        this.update_search_results();
    }

    onGraphClick(properties) {
        // handle click on graph node
        var ids = properties.nodes;

        if (ids.length === 1) {
            this.setState({
                info: {
                    "title": this.state.graphmanager.id_2_name[ids[0]],
                    'description': this.state.graphmanager.get_node(ids[0])['description']
                },
                logo: this.state.graphmanager.get_node(ids[0])['image']
            });

        if (this.state.currentlyLargeNode !== ""){
            this.state.graphmanager.get_node(this.state.currentlyLargeNode)['size']=25;
            if (this.state.graphmanager.vis_data.nodes.get(this.state.graphmanager.get_node(this.state.currentlyLargeNode)['id'])){
                this.state.graphmanager.vis_data.nodes.update(this.state.graphmanager.get_node(this.state.currentlyLargeNode));
            }
        }

        this.state.graphmanager.get_node(ids[0])['size']=35;
        this.state.graphmanager.vis_data.nodes.update(this.state.graphmanager.get_node(ids[0]));
        this.setState({currentlyLargeNode:ids[0]})
        }

    }

    update_search_results() {
        var search_results = this.state.graphmanager.get_search_results(this.state.searchstring);
        this.setState({searchresults: search_results});
    }

    onSearchInput(properties) {

        this.setState({searchstring: properties.target.value});
        var search_results = this.state.graphmanager.get_search_results(properties.target.value);
        this.setState({searchresults: search_results});
    }

    onClickRemoveCenterNode(node, properties) {
        if (this.state.centerNodes.includes(node)) {
            let new_center_nodes = this.state.centerNodes.filter(function (f) {
                return f !== node
            })
            this.setState({centerNodes: new_center_nodes})
        }
        this.state.graphmanager.remove_center_node(node);
        this.state.graphmanager.remove_hop(node);
        this.state.graphmanager.remove_above_below(node, 'above');
        this.state.graphmanager.remove_above_below(node, 'below');
        this.state.graphmanager.remove_shortest_path(node, this.state.centerNodes);
        this.update_search_results()
    }

    onClickAddCenterNode(node, properties) {
        if (!this.state.centerNodes.includes(node)) {
            this.setState({centerNodes: this.state.centerNodes.concat([node])});
        }
        this.state.graphmanager.add_center_node(node);
        if (this.state.settings['include_1_hop']) {
            this.state.graphmanager.add_hop(node, !this.state.settings['include_hierarchy']);
        }
        if (this.state.settings['include_direct_path']) {
            this.state.graphmanager.add_shortest_path(node, this.state.centerNodes);
        }
        if (this.state.settings['include_above']) {
            this.state.graphmanager.add_above_below(node, 'above');
        }
        if (this.state.settings['include_below']) {
            this.state.graphmanager.add_above_below(node, 'below');
        }

        this.update_search_results();

    }

    onClickResetSearchString() {
        console.log("reset search string.");  // todo implement what is done when the delete button is clicked
        this.setState({'searchstring': ""})
    }

    handleuserchange(e) {
        let {name, value} = e.target;
        if (value !== "Auswahl"){
            console.log('value', value)
            this.setState({nutzer: value});
        }
    }

    onSettingsChange(setting, properties) {
        let new_settings = Object.assign({}, this.state.settings);
        new_settings[setting] = properties.target.checked;
        this.setState({settings: new_settings});
        this.componentDidMount();
        this.setState({"centerNodes": [], "searchstring": ""});
        var search_results = this.state.graphmanager.get_search_results(this.state.searchstring);
        console.log(search_results);
        this.setState({searchresults: search_results});
        console.log('on settings change!');




        var container = document.getElementById('mynetwork');
        var options = {"physics": {"enabled": true, "solver": 'repulsion'}};
        var data = {nodes: new window.vis.DataSet([]), edges: new window.vis.DataSet(edges)};

        var network = new window.vis.Network(container, data, options);

        // create graph manager
        var graph_manager = new GraphManager(nodes, edges, network, data);

        this.setState({graphmanager: graph_manager})

        // set on click on graph trigger
        network.on('click', this.onGraphClick);
        network.on('doubleClick', this.onGraphDoubleClick);


        // on startup show all available nodes in the search
        var search_results = graph_manager.get_search_results("");
        this.setState({searchresults: search_results});
        //this.update_search_results();
    }

    render() {

        return (

            <div style={{height: "100 vh"}}>
                <WelcomeModal/>
                <div className="container-fluid" style={{height: "100vh"}}>
                    <div className="row" style={{height: "100vh"}}>
                        <div className="col-md-auto" style={{height: "100vh", backgroundColor: "#f0f0f0"}}>

                            {/* Navbar */}
                            <div className="text-white" style={{
                                position: "relative",
                                height: "100vh"
                            }}>
                                <button style={{
                                    "background": "none",
                                    "border": "none",
                                    "color": "blue",
                                    width: "100%",
                                    textAlign: "left",
                                    fontSize: "25px",
                                    paddingTop: "20px"
                                }}>
                                    <img src={logo} alt="React Logo" style={{height: "60px"}}/>
                                </button>

                                <hr style={{color: "#545453"}}/>

                                <div className="">
                                    <a style={{color: "gray"}}>
                                        Eingeloggt als: <br/>
                                        <b>{this.state.nutzer}</b>
                                    </a>
                                    <hr style={{color: "#545453"}}/>
                                    <GraphModal/>
                                    <LegendModal/>
                                    <DatabaseModal/>
                                    <ExportModal/>
                                    <PrintModal downloadurl={this.state.downloadurl}/>

                                    <SettingsModal onChange={this.onSettingsChange}
                                                   include_direct_path={this.state.settings['include_direct_path']}
                                                   include_1_hop={this.state.settings['include_1_hop']}
                                                   include_above={this.state.settings['include_above']}
                                                   include_below={this.state.settings['include_below']}
                                                   include_hierarchy={this.state.settings['include_hierarchy']}/>

                                    <UserModal handleuserchange={this.handleuserchange} nutzer={this.state.nutzer}/>
                                </div>

                                <div style={{position: "absolute", bottom: "10px", width: "100%"}}>


                                    <div className="">
                                        {/* Settings modal */}


                                        <hr style={{color: "#545453"}}/>

                                        <Impressum/>
                                        <br/>
                                        <a style={{color: "gray", fontSize: "12px", textDecoration: "none", textAlign: "center"}} href={"https://sunto-it.de"}>Powered by <img src={logosuntoit} alt="React Logo" style={{height: "50px"}}/></a>

                                    </div>
                                </div>
                            </div>

                        </div>
                        {/* Vis JS Network visualisation */}
                        <div className="col">
                            <div id="mynetwork" style={{width: "100%", height: "100vh"}}></div>
                            <a id="canvasImg" download="filename"></a>




                        </div>
                        {/* Sidebar right */}
                        <div className="col col-2">
                            <SearchConfigurator onSearchInput={this.onSearchInput}
                                                onClickResetSearchString={this.onClickResetSearchString}
                                                searchstring={this.state.searchstring}
                                                searchresults={this.state.searchresults}
                                                onClickAddCenterNode={this.onClickAddCenterNode}
                                                onClickRemoveCenterNode={this.onClickRemoveCenterNode}
                                                centerNodes={this.state.centerNodes}/>

                            <ShowNodeProperties information={this.state.info} logo={this.state.logo}/>

                        </div>
                    </div>

                </div>
            </div>

        );
    }
}


function ShowSelectedNodes(props) {
    let selections = []

    for (const node_string of props.centerNodes) {
        selections.push(<div onClick={(p) => props.onClick(node_string, p)} className={"selectorItem"}><FontAwesomeIcon icon={faCircleMinus}
                                                                                             /> {node_string}
        </div>);
    }

    return (
        <div style={{maxHeight: '5em', overflowY: "auto"}}>
            {selections}
        </div>
    )
}

function ShowSearchResults(props) {
    let selections = []
    var search_results = props.searchresults;
    search_results.sort();

    for (const node_string of search_results) {
        selections.push(<div onClick={(p) => props.onClick(node_string, p)} className={"selectorItem"}><FontAwesomeIcon icon={faCirclePlus}
                                                                                             /> {node_string}
        </div>);
    }

    return (
        <div style={{height: '7em', overflowY: "auto"}}>
            {selections}
        </div>
    )
}

function GraphModal(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div>
            <button className={"menuBarButton"} onClick={handleShow}>
                <FontAwesomeIcon icon={faProjectDiagram} style={{width: "18", height: "18"}}/>
                {" Graph"}
            </button>
            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Wissensgraph</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Unter dem Begriff Knowledge Graph versteht man zunächst ganz allgemein eine Systematik, anhand derer Informationen gesucht und miteinander verknüpft werden. (Bezogen auf diesen Anwendungsfall sind hiermit vor allem (Abstrakte Strukturen, Hierarchien, Organisationen, Organisationseinheiten und Personen gemeint).
                        <br/>
                        <br/>
                        Wissensgraphen werden oft mit „Linked Open Data“ in Verbindung gebracht und sind aus dem Internet gar nicht mehr wegzudenken. Sie werden z. B. von Suchmaschinen und intelligenten Systemen verwendet, um große abstrakte Datenmengen besonders effizient zu verarbeiten und komplexe Beziehungen darzustellen.

                    </p>
                    <img src={graph_png} alt="React Logo" style={{
                        width: "30%", marginLeft: "auto",
                        marginRight: "auto", display: "block"
                    }}/>

                </Modal.Body>
            </Modal>
        </div>
    )

}

function WelcomeModal(props) {
    const [show, setShow] = useState(true);
    const handleClose = () => setShow(false);

    return (
        <div>
            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Willkommen</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <br/>
                    <center>
                        <p>
                        Herzlich willkommen beim Sunto-Graph Prototypen. <br/><br/>
                        Bei dieser Webanwendung handelt es sich um einen Prototypen zur Visualisierung komplexer
                        Verwaltungsstrukturen und ist Teil des
                        Gesamtkonzepts der zweiten GovUp.NRW Challenge (2022).
                    </p>
                        <br/>

                        <iframe width="560" height="315" src="https://www.youtube.com/embed/VBSy1vmw2vs"
                                title="YouTube video player" frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen style={{textAlign: "center"}}></iframe>
                    </center>
                </Modal.Body>
            </Modal>
        </div>
    )

}

function LegendModal(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div>
            <button className={"menuBarButton"} onClick={handleShow}>
                <FontAwesomeIcon icon={faBook} style={{width: "18", height: "18"}}/>
                {" Legende"}
            </button>
            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Legende</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Im Folgenden werden die im Graph verwendeten Symbole aufgelistet und beschrieben.  </p>
                    <div>
                        <img src="./icons/city-solid_new.svg" alt="image" className={"legendIcon"} />
                        <span>Dieses Symbol repräsentiert die Art einer Institution. Beispielsweise: „Bezirksregierung“.</span>
                    </div>
                    <br/>
                    <div>
                        <img src="./icons/building-solid_new.svg" alt="image" className={"legendIcon"} />
                        <span>Dieses Symbol repräsentiert eine (spezifische) Institution, aufgegliedert in die Art der Institution und ihren Standort. Beispielsweise: „Bezirksregierung Arnsberg“. </span>
                    </div>
                    <br/>
                    <div>
                        <img src="./icons/house-user-solid_new.svg" alt="image" className={"legendIcon"} />
                        <span>Dieses Symbol repräsentiert ein Dezernat.</span>
                    </div>
                    <br/>
                    <div>
                        <img src="./icons/code-fork-solid_new.svg" alt="image" className={"legendIcon"} />
                        <span>Dieses Symbol repräsentiert die Position einer Person. Beispielsweise: „Dezernatsleitung“.</span>
                    </div>
                    <br/>
                    <div>
                        <img src="./icons/school-solid_new.svg" alt="image" className={"legendIcon"} />
                        <span>Dieses Symbol repräsentiert ein Schulform.</span>
                    </div>
                    <br/>
                    <div>
                        <img src="./icons/briefcase-solid_new.svg" alt="image" className={"legendIcon"}/>
                        <span>Dieses Symbol repräsentiert den Aufgabenbereich einer Person, aufgegliedert in die ausgeübte Funktion und die Schulform. Beispielsweise: „Schulaufsicht Grundschule“.</span>
                    </div>
                    <br/>
                    <div>
                        <img src="./icons/user-solid_new.svg" alt="image" className={"legendIcon"} />
                        <span>Dieses Symbol repräsentiert eine Person.</span>
                    </div>
                    <br/>
                    <div>
                        <img src="./icons/users-solid_new.svg" alt="image" className={"legendIcon"} />
                        <span>Dieses Symbol repräsentiert eine Generale oder eine Arbeitseinheit..</span>
                    </div>
                    <br/>
                    <hr/>
                    Darüber hinaus gibt es folgende Konventionen:
                    <ul>
                        <li> <b>L</b> Leitung einer Arbeitsgruppe</li>
                        <li> <b>TN</b> Teilnehmende Person einer Arbeitsgruppe</li>
                    </ul>
                </Modal.Body>
            </Modal>
        </div>
    )

}

function ExportModal(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div>
            <button className={"menuBarButton"} onClick={handleShow}>
                <FontAwesomeIcon icon={faFileExport} style={{width: "18", height: "18"}}/>
                {" Export"}
            </button>
            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Export</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Die von Ihnen bereitgestellten Daten (gesamter Datenbankdump) werden in einer Graph-Struktur im
                        RDF-Format bereitgestellt. Dieses Dateiformat entspricht dem maschinenlesbaren Standardformat
                        zur Weiterverarbeitung und Interpretation der Daten.
                    <br/><br/>Dieses Format wird ebenfalls standardmäßig für die die Bereitstellung von öffentlich
                        zugänglichen Datensätzen (Open Data) verwendet.</p>
                    <Form>
                        <img src={graph_download} alt="React Logo" style={{
                            width: "50%", marginLeft: "auto",
                            marginRight: "auto", display: "block"
                        }}/>
                        <br/>
                        <div className="col text-center">
                            <Button href={graph_file} download="suntograph_bra.nt" variant="primary btn-dark"> <FontAwesomeIcon
                                icon={faDownload} style={{width: "18", height: "18"}}/> Herunterladen</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    )
}

function PrintModal(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div>
            <button className={"menuBarButton"} onClick={handleShow}>
                <FontAwesomeIcon icon={faPrint} style={{width: "18", height: "18"}}/>
                {" Drucken"}
            </button>

            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Drucken</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Hier wird automatisch eine Bilddatei Ihres Graphen heruntergeladen. Dieses können Sie bei Bedarf im anschließend ausdrucken. </p>
                    <Form>
                        <br/>
                        <div className="col text-center">
                            <Button variant="primary btn-dark" onClick={() => {
                                console.log(props.downloadurl)
                                const link = document.createElement("a");
                                link.href = props.downloadurl.canvas.toDataURL();
                                link.download = "sunto-graph.png";
                                link.click();
                            }}> <FontAwesomeIcon
                                icon={faDownload} style={{width: "18", height: "18"}} /> Herunterladen</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>


        </div>
    )
}



function UserModal(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    let button = <div></div>
    if (props.nutzer === "Administrator"){
        button = <button className={"menuBarButton"} onClick={handleShow}>
            <FontAwesomeIcon icon={faUsers} style={{width: "18", height: "18"}}/>
            {" Nutzerverwaltung"}
        </button>;

    }


    return (
        <div>
            {button}
            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Benutzerverwaltung</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Zur Umsetzung der DSGVO-konformität wurde das Berechtigungskonzept bereits berücksichtigt.
                        In diesem wird geregelt, welche Zugriffsregeln für einzelne Benutzer oder Benutzergruppen
                        auf die Daten eines IT-Systems gelten.
                        <br/><br/>
                        <b>Hinweis:</b> Da die Anforderung der Bezirksregierung zunächst eine interne Verwendung mit unkritischen Daten vorsieht, sind die bisher eingespielten Daten für alle Rollen und Berechtigungsgruppen einsehbar.
                        <br/>
                    </p>
                    <Form.Group as={Col} controlId="formGridState">
                        <Row><Form.Label>Auswahl der Benutzerrolle</Form.Label></Row>
                        <Row>
                            <Col>
                                <Form.Select onChange={props.handleuserchange}>
                                    <option>Auswahl</option>
                                    <option value={"Administrator"}>Administrator</option>
                                    <option value={"Dezernatsleitung"}>Dezernatsleitung</option>
                                    <option value={"Sachgebietsleitung"}>Sachgebietsleitung</option>
                                    <option value={"Sachbearbeiter"}>Sachbearbeiter</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    </Form.Group>
                </Modal.Body>
            </Modal>
        </div>
    )
}

function DatabaseModal(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    return (
        <div>
            <button className={"menuBarButton"} onClick={handleShow}>
                <FontAwesomeIcon icon={faTable} style={{width: "18", height: "18"}}/>
                {" Datenbank"}
            </button>
            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Datenbank-Verwaltung</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    <p>Innerhalb dieses Menüs haben Sie die Möglichkeit bestehende Daten zu ergänzen, bearbeiten oder zu löschen. Für den Import können Sie die standardmäßig verwendeten Dateiformate (CSV, XML, XLSX, XLS, XLM, XLSM) nutzen.
                        Hinweis: Bitte beachten Sie, dass die gelöschten Daten unmittelbar und permanent gelöscht werden.
                    </p>
                    <hr/>

                    <h5>Datei Importieren </h5>
                    <Form>

                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Label>Importieren Sie eine Datei (CSV, XML, XLSX, XLS, XLM, XLSM) um neue Daten hinzuzufügen.
                                Eine Vorlage für die Daten können Sie <a href={graph_file} download="import_vorlage.csv" style={{textDecoration: "none", color: "black"}}> <FontAwesomeIcon
                            icon={faDownload} style={{width: "18", height: "18"}}/> <b>hier</b></a> herunterladen. </Form.Label>

                            <Form.Control type="file"/>
                        </Form.Group>
                        <AlertDismissibleExample/>

                    </Form>

                    <hr/>

                    <h5>Daten manuell hinzufügen </h5>
                    <Form>
                        <Row>
                            <Col>
                                <Form.Control placeholder="Nachname"/>
                            </Col>
                            <Col>
                                <Form.Control placeholder="Vorname"/>
                            </Col>
                        </Row>
                        <br/>
                        <Row>

                                <Form.Group as={Col} controlId="formGridState">
                                    <Row><Form.Label>Generale </Form.Label></Row>
                                    <Row>
                                        <Col>
                                            <Form.Select defaultValue="-">
                                                <option>nicht bekannt</option>
                                                <option>Berufsorientierung</option>
                                                <option>Bildung für nachhaltige Entwicklung</option>
                                                <option>Datenschutz</option>
                                                <option>Digitale Bildung</option>
                                                <option>Externenprüfung</option>
                                                <option>Gleichstellung</option>
                                                <option>Inklusion</option>
                                                <option>Integration durch Bildung</option>
                                                <option>Internetauftritt</option>
                                                <option>Kompetenzteam</option>
                                                <option>Krisenteam</option>
                                                <option>politische & kulturelle Bildung</option>
                                                <option>Regionales Bildungsnetzwerk</option>
                                                <option>Schulpsychologie</option>
                                            </Form.Select>
                                        </Col>
                                        <Col>
                                            <Form.Select defaultValue="-">
                                                <option>nicht bekannt</option>
                                                <option>Berufsorientierung</option>
                                                <option>Bildung für nachhaltige Entwicklung</option>
                                                <option>Datenschutz</option>
                                                <option>Digitale Bildung</option>
                                                <option>Externenprüfung</option>
                                                <option>Gleichstellung</option>
                                                <option>Inklusion</option>
                                                <option>Integration durch Bildung</option>
                                                <option>Internetauftritt</option>
                                                <option>Kompetenzteam</option>
                                                <option>Krisenteam</option>
                                                <option>politische & kulturelle Bildung</option>
                                                <option>Regionales Bildungsnetzwerk</option>
                                                <option>Schulpsychologie</option>
                                            </Form.Select>
                                        </Col>
                                        <Col>
                                            <Form.Select defaultValue="-">
                                                <option>nicht bekannt</option>
                                                <option>Berufsorientierung</option>
                                                <option>Bildung für nachhaltige Entwicklung</option>
                                                <option>Datenschutz</option>
                                                <option>Digitale Bildung</option>
                                                <option>Externenprüfung</option>
                                                <option>Gleichstellung</option>
                                                <option>Inklusion</option>
                                                <option>Integration durch Bildung</option>
                                                <option>Internetauftritt</option>
                                                <option>Kompetenzteam</option>
                                                <option>Krisenteam</option>
                                                <option>politische & kulturelle Bildung</option>
                                                <option>Regionales Bildungsnetzwerk</option>
                                                <option>Schulpsychologie</option>
                                            </Form.Select>
                                        </Col>
                                    </Row>
                                </Form.Group>


                        </Row>
                        <br/>
                        <Row>
                            <Form.Group as={Col} controlId="formGridState">
                                <Row><Form.Label>Arbeitsgruppe </Form.Label></Row>
                                <Row>
                                    <Col>
                                        <Form.Select defaultValue="-">
                                            <option>nicht bekannt</option>
                                            <option>AG Inklusion</option>
                                            <option>AG Integration durch Bildung</option>
                                            <option>AG Sprachbildung</option>
                                            <option>AK Bildung in der digitalen Welt</option>
                                            <option>Externenprüfung</option>
                                            <option>AK Kapazitätenplanung</option>
                                            <option>Gleichstellung</option>
                                            <option>HDK</option>
                                            <option>Lenkungskreis Kooperation Abt. 4</option>
                                            <option>Organisationseinheit AKK</option>
                                            <option>Steuergruppe Ressource Inklusion</option>
                                        </Form.Select>
                                    </Col>
                                    <Col>
                                        <Form.Select defaultValue="-">
                                            <option>nicht bekannt</option>
                                            <option>AG Inklusion</option>
                                            <option>AG Integration durch Bildung</option>
                                            <option>AG Sprachbildung</option>
                                            <option>AK Bildung in der digitalen Welt</option>
                                            <option>Externenprüfung</option>
                                            <option>AK Kapazitätenplanung</option>
                                            <option>Gleichstellung</option>
                                            <option>HDK</option>
                                            <option>Lenkungskreis Kooperation Abt. 4</option>
                                            <option>Organisationseinheit AKK</option>
                                            <option>Steuergruppe Ressource Inklusion</option>
                                        </Form.Select>
                                    </Col>
                                    <Col>
                                        <Form.Select defaultValue="-">
                                            <option>nicht bekannt</option>
                                            <option>AG Inklusion</option>
                                            <option>AG Integration durch Bildung</option>
                                            <option>AG Sprachbildung</option>
                                            <option>AK Bildung in der digitalen Welt</option>
                                            <option>Externenprüfung</option>
                                            <option>AK Kapazitätenplanung</option>
                                            <option>Gleichstellung</option>
                                            <option>HDK</option>
                                            <option>Lenkungskreis Kooperation Abt. 4</option>
                                            <option>Organisationseinheit AKK</option>
                                            <option>Steuergruppe Ressource Inklusion</option>
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </Form.Group>


                        </Row>
                        <br/>
                        <AlertDismissibleUpdateExampleManual/>

                        <hr/>

                        <h5>Daten manuell entfernen </h5>

                            <Row>

                                <Form.Group as={Col} controlId="formGridState">
                                    <Row><Form.Label>Person </Form.Label></Row>
                                    <Row>
                                        <Col>
                                            <Form.Select defaultValue="-">
                                                <option>Auswahl</option>
                                                <option>Lindsay Davenport</option>
                                                <option>Margaret Osborne duPont</option>
                                                <option>Michael Stich</option>
                                                <option>Maria Bueno</option>
                                                <option>Andy Murray</option>
                                                <option>Chuck McKinley</option>
                                                <option>Suzanne Lenglen</option>
                                                <option>Virginia Wade</option>
                                                <option>Bill Johnston</option>
                                                <option>Dorothy Round</option>
                                                <option>Roger Federer</option>
                                                <option>Fred Perry</option>
                                                <option>Doris Hart</option>
                                                <option>Ernest Renshaw</option>
                                                <option>Charlotte Cooper</option>
                                                <option>Dorothea Douglass</option>
                                                <option>Whoopi Goldberg</option>
                                                <option>Jack Kramer</option>
                                                <option>Adam Sandler</option>
                                                <option>Arthur Gore</option>
                                                <option>Kitty Godfree</option>
                                            </Form.Select>
                                        </Col>
                                    </Row>
                                </Form.Group>

                            </Row>
                            <br/>
                            <AlertDismissibleDeleteManual/>
                        <br/>
                        <br/>
                        <Row>

                            <Form.Group as={Col} controlId="formGridState">
                                <Row><Form.Label>Generale / Arbeitsheinheit </Form.Label></Row>
                                <Row>
                                    <Col>
                                        <Form.Select defaultValue="-">
                                            <option>Auswahl</option>
                                            <option>Berufsorientierung</option>
                                            <option>Bildung für nachhaltige Entwicklung</option>
                                            <option>Datenschutz</option>
                                            <option>Digitale Bildung</option>
                                            <option>Externenprüfung</option>
                                            <option>Gleichstellung</option>
                                            <option>Inklusion</option>
                                            <option>Integration durch Bildung</option>
                                            <option>Internetauftritt</option>
                                            <option>Kompetenzteam</option>
                                            <option>Krisenteam</option>
                                            <option>politische & kulturelle Bildung</option>
                                            <option>Regionales Bildungsnetzwerk</option>
                                            <option>Schulpsychologie</option>
                                            <option>AG Inklusion</option>
                                            <option>AG Integration durch Bildung</option>
                                            <option>AG Sprachbildung</option>
                                            <option>AK Bildung in der digitalen Welt</option>
                                            <option>Externenprüfung</option>
                                            <option>AK Kapazitätenplanung</option>
                                            <option>Gleichstellung</option>
                                            <option>HDK</option>
                                            <option>Lenkungskreis Kooperation Abt. 4</option>
                                            <option>Organisationseinheit AKK</option>
                                            <option>Steuergruppe Ressource Inklusion</option>
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </Form.Group>

                        </Row>
                        <br/>
                        <AlertDismissibleDeleteManual/>

                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    )

}

function AlertDismissibleExample() {
    const [show, setShow] = useState(false);

    if (show) {
        return (
            <Alert variant="danger" onClose={() => setShow(false)} dismissible>
                <Alert.Heading>Achtung</Alert.Heading>
                <p>
                    <b>Achtung</b>
                    Diese Funktion wird von diesem Prototypen noch nicht unterstützt, da die Struktur organisationsübergreifend nicht einheitlich benannt ist. Um eine flächendeckende Funktionalität zu gewährleisten, muss die Importvorlage mit den beteiligten Organisationen zunächst abgestimmt, oder für jede Organisation angepasst werden.
                    <br/><br/>
                    In der Zukunft ist ein einfacher Dateiimport möglich.

                </p>
            </Alert>
        );
    }
    return <Button onClick={() => setShow(true)} variant="primary btn-dark"><FontAwesomeIcon icon={faUpload} style={{
        width: "18",
        height: "18"
    }}/> Hochladen</Button>;
}

function AlertDismissibleExampleManual() {
    const [show, setShow] = useState(false);

    if (show) {
        return (
            <Alert variant="danger" onClose={() => setShow(false)} dismissible>
                <Alert.Heading>Achtung</Alert.Heading>
                <p>
                    Diese Funktion wird von unserem Prototypen leider noch nicht unterstützt.
                </p>
            </Alert>
        );
    }
    return <Button onClick={() => setShow(true)} variant="primary btn-dark"><FontAwesomeIcon icon={faUpload} style={{
        width: "18",
        height: "18"
    }}/> Hochladen</Button>;
}

function AlertDismissibleUpdateExampleManual() {
    const [show, setShow] = useState(false);

    if (show) {
        return (
            <Alert variant="danger" onClose={() => setShow(false)} dismissible>
                <Alert.Heading>Achtung</Alert.Heading>
                <p>
                    Diese Funktion wird von unserem Prototypen leider noch nicht unterstützt.
                </p>
            </Alert>
        );
    }
    return <Button onClick={() => setShow(true)} variant="primary btn-dark"><FontAwesomeIcon icon={faArrowRotateRight} style={{
        width: "18",
        height: "18"
    }}/> Aktualisieren</Button>;
}

function AlertDismissibleDeleteManual() {
    const [show, setShow] = useState(false);

    if (show) {
        return (
            <Alert variant="danger" onClose={() => setShow(false)} dismissible>
                <Alert.Heading>Achtung</Alert.Heading>
                <p>
                    Diese Funktion wird von unserem Prototypen leider noch nicht unterstützt.
                </p>
            </Alert>
        );
    }
    return <Button onClick={() => setShow(true)} variant="primary btn-dark"><FontAwesomeIcon icon={faTrashCan} style={{
        width: "18",
        height: "18"
    }}/> Löschen</Button>;
}


function SettingsModal(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div>
            <button className={"menuBarButton"} onClick={handleShow}>
                <FontAwesomeIcon icon={faCog} style={{width: "18", height: "18"}}/>
                {" Konfiguration"}
            </button>

            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Konfiguration</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Mit den folgenden Einstellungen ist es möglich, die Graph-Visualisierung individuell zu konfigurieren:
                    <br/>
                    <br/>
                    <Form>
                        <Form.Check onChange={(p) => props.onChange("include_1_hop", p)}
                                    type="switch"
                                    label="Zeige direktes Umfeld (Zeigt alle Informationen und Zugehörigkeiten einer Person in der Graph-Ansicht.)"
                                    defaultChecked={props.include_1_hop}
                        />
                        <br/>
                        <Form.Check onChange={(p) => props.onChange("include_direct_path", p)}
                                    type="switch"
                                    label="Zeige direkte Verbindungen (Zeigt die kürzeste Verbindung zwischen zwei Personen. Beispielsweise: Die Zusammenarbeit in der gleichen Organisation/Einheit oder, wenn diese Personen nicht direkt zusammenarbeiten, gemeinsame Kolleg*innen.)"
                                    defaultChecked={props.include_direct_path}
                        />
                        <br/>
                        <Form.Check onChange={(p) => props.onChange("include_above", p)}
                                    type="switch"
                                    label="Zeige Struktur über X (Zeigt Strukturen, Einrichtungen und Personen, die in der Hierarchie überstellt sind.)"
                                    defaultChecked={props.include_above}
                        />
                        <br/>
                        <Form.Check onChange={(p) => props.onChange("include_below", p)}
                                    type="switch"
                                    label="Zeige Struktur unter X (Zeigt Strukturen, Einrichtungen und Personen, die in der Hierarchie unterstellt sind.)"
                                    defaultChecked={props.include_below}
                        />
                        <br/>
                        <Form.Check onChange={(p) => props.onChange("include_hierarchy", p)}
                                                              type="switch"
                                                              label="Zeige nur Zuordnung von Personen zu Generalen und Arbeitsgruppen (Alle anderen Strukturen werden ausgeblendet.)"
                                                              defaultChecked={props.include_hierarchy}
                        />
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}


function Impressum(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div>
            <a href="https://sunto-it.de/?page_id=277." target="_blank">
                <button className={"menuBarButton"}>
                <FontAwesomeIcon icon={faBook} style={{width: "18", height: "18"}}/>
                {" Impressum"
                }
            </button>
            </a>
            <a href="https://sunto-it.de/?page_id=267" target="_blank">
                <button className={"menuBarButton"}>
                    <FontAwesomeIcon icon={faShieldHalved} style={{width: "18", height: "18"}}/>
                    {" Datenschutz"
                    }
                </button>
            </a>
        </div>
    );
}


function SearchConfigurator(props) {
    return (
        <Card style={{width: '100%', marginRight: '1em', marginTop: '1em', height: '49%'}}>
            <Card.Body style={{display: "flex", flexDirection: "column"}}>
                <Card.Title> Suche </Card.Title>

                <Form>
                    <Form.Group>
                        <InputGroup className="mb-3">
                            <Form.Control placeholder="..." onInput={props.onSearchInput} value={props.searchstring}/>
                            <Button variant="primary btn-dark" onClick={props.onClickResetSearchString}>
                                Löschen
                            </Button>
                        </InputGroup>
                    </Form.Group>
                </Form>

                <ShowSearchResults searchstring={props.searchstring} searchresults={props.searchresults}
                                   onClick={props.onClickAddCenterNode}/>
                <hr/>

                <div style={{marginTop: "auto"}}>
                    <hr/>
                    <ShowSelectedNodes onClick={props.onClickRemoveCenterNode} centerNodes={props.centerNodes}/>
                </div>
            </Card.Body>
        </Card>
    );
}


function ShowNodeProperties(props) {
    let information_order = ["Behörde", "Hinweis", "Telefon", "E-Mail"];

    let additional_information = [];
    if ('description' in props.information && props.information['description'] !== undefined) {
        for (const information_key of information_order) {
            if (information_key in props.information['description']) {
                additional_information.push(<div>
                    <b>{information_key}</b>: {props.information['description'][information_key]} </div>)
            }
        }
    } else {
        additional_information.push(<div>Uns liegen hierzu leider keine weiteren Informationen vor.</div>)
    }

    let logo = ''
    if (props.logo !== ''){
        logo = <img style={{width: 50, height: 50, marginBottom: 10}} src={props.logo}></img>
    }

    return (
        <Card style={{width: '100%', marginRight: '1em', marginTop: '1em', height: '45%'}}>
            <Card.Body>
                {logo}
                <Card.Title> {props.information['title']}    </Card.Title>
                <Card.Text>
                    {additional_information}
                </Card.Text>
            </Card.Body>
        </Card>
    );
}


export default Menu;