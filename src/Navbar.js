import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import logo from './logo_sunto-it.svg';
import graph_download from './hierarchydata1.svg'
import graph_file from './graph.nt';
import graph_png from './graph-full.png'

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faProjectDiagram,
    faCog,
    faTable,
    faCircleMinus,
    faCirclePlus,
    faFileExport, faDownload, faUpload, faBook, faShieldHalved
} from '@fortawesome/free-solid-svg-icons'
import Button from "react-bootstrap/Button";
import button from "bootstrap/js/src/button";
import React, {useState} from 'react';
import graphFile from './graph.json';
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
                'description': {'Aufgabenbeschreibung': 'Klicken Sie auf einen Knoten um hier nähere Informationen anzuzeigen.'}
            },
            searchstring: "",
            searchresults: [],
            graphmanager: "",
            centerNodes: [],
            settings: {"include_direct_path": false, "include_1_hop": true, "include_above": false, "include_below": false, 'include_hierarchy': true},
            currentlyLargeNode: ""
        };
        this.onGraphClick = this.onGraphClick.bind(this);
        this.onGraphDoubleClick = this.onGraphDoubleClick.bind(this);
        this.onSearchInput = this.onSearchInput.bind(this);
        this.onClickRemoveCenterNode = this.onClickRemoveCenterNode.bind(this);
        this.onClickAddCenterNode = this.onClickAddCenterNode.bind(this);
        this.update_search_results = this.update_search_results.bind(this);
        this.onSettingsChange = this.onSettingsChange.bind(this);
        this.onSettingsChange = this.onSettingsChange.bind(this);
        this.onClickResetSearchString = this.onClickResetSearchString.bind(this);
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


        // on startup show all available nodes in the search
        var search_results = graph_manager.get_search_results("");
        this.setState({searchresults: search_results});
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
                }
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
            this.state.graphmanager.add_hop(node, this.state.settings['include_hierarchy']);
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
        this.state['searchstring'] = '';
        this.setState({'searchstring': ""})
    }

    onSettingsChange(setting, properties) {
        let new_settings = Object.assign({}, this.state.settings);
        new_settings[setting] = properties.target.checked;
        this.setState({settings: new_settings});
        this.componentDidMount();
    }

    render() {

        return (

            <div style={{height: "100 vh"}}>
                {/*<WelcomeModal />*/}
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
                                    <GraphModal/>
                                    <DatabaseModal/>
                                    <ExportModal/>
                                </div>

                                <div style={{position: "absolute", bottom: "10px", width: "100%"}}>


                                    <div className="">
                                        {/* Settings modal */}
                                        <SettingsModal onChange={this.onSettingsChange}
                                                       include_direct_path={this.state.settings['include_direct_path']}
                                                       include_1_hop={this.state.settings['include_1_hop']}
                                                       include_above={this.state.settings['include_above']}
                                                       include_below={this.state.settings['include_below']}
                                                       include_hierarchy={this.state.settings['include_hierarchy']}/>
                                        <hr style={{color: "#545453"}}/>
                                        <Impressum/>
                                    </div>
                                </div>
                            </div>

                        </div>
                        {/* Vis JS Network visualisation */}
                        <div className="col">
                            <div id="mynetwork" style={{width: "100%", height: "100vh"}}></div>
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

                            <ShowNodeProperties information={this.state.info}/>

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
        <div style={{maxHeight: '8em', overflowY: "auto"}}>
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
                    <p>Ein Wissensgraph ist eine möglichkeit der Wissensrepräsentation in einer Graphstruktur.
                        Wissensgraphen werden
                        oft dafür benutzt um Entitäten (Personen, Events, abstrakte Konzepte) und ihre Beziehungen
                        zueinander zu speichern. <br/>

                        Seit der Entwicklung des Semantic Web werden Wissensgraphen oft mit Linked Open Data in
                        verbindung gebracht.
                        Wissensgraphen sind aus dem Internet nicht mehr wegzudenken. Sie werden z.B. von Suchmaschinen
                        (Google) oder Smart-Speakern (Siri, Alexa) verwendet, um
                        Suchangragen besonders effizient zu verarbeiten, oder von Sozialen Netzwerken (Facebook,
                        LinkedIn), um komplexe Beziehungen zwischen Personen
                        zu speichern.
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
                    <p>Sunto-IT</p>
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
                    <p>Ihre Tabellarischen Daten wurden von uns in eine Graph-Struktur transformiert. Dieser
                        Wissensgraph
                        ist in dem standardisierten RDF Format Gespeichert und entspricht somit allen Ansprüchen um als
                        Open-Data veröffentlich werden zu können (Stichwort: Offene Verwaltung).</p>
                    <Form>
                        {/*todo durch neue Fiver Grafik ersetzen*/}
                        <img src={graph_download} alt="React Logo" style={{
                            width: "50%", marginLeft: "auto",
                            marginRight: "auto", display: "block"
                        }}/>
                        <br/>
                        <div className="col text-center">
                            <Button href={graph_file} download="graph.nt" variant="primary btn-dark"> <FontAwesomeIcon
                                icon={faDownload} style={{width: "18", height: "18"}}/> Downloaden</Button>
                        </div>
                    </Form>
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

                    <p>In der Datenbank-Verwaltung können die bestehenden Daten geändert oder gelöscht werden.
                        Hierbei wollen wir möglicht flexibel sein und verschiedene Dateiformate, z.B. Excel oder CSV,
                        unterstützen.
                        Unsere Software wird in der Lage sein, diese Informationen in echtzeit in eine
                        Graphrepräsentation zu überführen. </p>
                    <hr/>

                    <h5>Datei Upload </h5>
                    <Form>

                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Label>Hier können Sie eine neue Datei (z.B. Excel) hochladen, um die Daten der
                                Visualisierung zu aktuallisieren. </Form.Label>
                            <Form.Control type="file"/>
                        </Form.Group>
                        <AlertDismissibleExample/>

                    </Form>

                    <hr/>

                    <h5>Daten manuell ergänzen </h5>
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
                        <AlertDismissibleExampleManual/>

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
                    Diese Funktion wird von unserem Prototypen leider noch nicht unterstützt. In Zukunft sollen aber ein
                    einfacher Datei-Upload möglich sein.
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


function SettingsModal(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div>
            <button className={"menuBarButton"} onClick={handleShow}>
                <FontAwesomeIcon icon={faCog} style={{width: "18", height: "18"}}/>
                {" Settings"}
            </button>

            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Einstellungen</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Mit diesen Einstellungen ist es möglich, die Graph Visualisierung individuell zu konfigurieren:
                    <Form>
                        <Form.Check onChange={(p) => props.onChange("include_1_hop", p)}
                                    type="switch"
                                    label="Zeige direktes Umfeld"
                                    defaultChecked={props.include_1_hop}
                        />
                        <Form.Check onChange={(p) => props.onChange("include_direct_path", p)}
                                    type="switch"
                                    label="Zeige direkte Verbindungen"
                                    defaultChecked={props.include_direct_path}
                        />
                        <Form.Check onChange={(p) => props.onChange("include_above", p)}
                                    type="switch"
                                    label="Zeige Struktur über x"
                                    defaultChecked={props.include_above}
                        />
                        <Form.Check onChange={(p) => props.onChange("include_below", p)}
                                    type="switch"
                                    label="Zeige Struktur unter x"
                                    defaultChecked={props.include_below}
                        />
                        <Form.Check onChange={(p) => props.onChange("include_hierarchy", p)}
                                                              type="switch"
                                                              label="zeige hierarchy an"
                                                              defaultChecked={props.include_hierarchy}
                        />
                    </Form>
                    <hr/>
                    Weitere Einstellungen würden hier erscheinen:
                    <Form>
                        <Form.Check
                            type="checkbox"
                            label="Auswahlkästchen"
                        />
                        <Form.Check onChange={props.onChange}
                                    type="switch"
                                    id="custom-switch"
                                    label="Weitere Einstellung"
                                    defaultChecked={false}
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
        <Card style={{width: '100%', marginRight: '1em', marginTop: '1em', height: '47%'}}>
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

                <div style={{marginTop: "auto"}}>
                    <hr/>
                    <ShowSelectedNodes onClick={props.onClickRemoveCenterNode} centerNodes={props.centerNodes}/>
                </div>
            </Card.Body>
        </Card>
    );
}


function ShowNodeProperties(props) {
    let information_order = ["Behörde", "Aufgabenbeschreibung", "Telefon", "E-Mail"];

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


    return (
        <Card style={{width: '100%', marginRight: '1em', marginTop: '1em', height: '45%'}}>
            <Card.Body>
                <Card.Title> {props.information['title']}    </Card.Title>
                <Card.Text>
                    {additional_information}
                </Card.Text>
            </Card.Body>
        </Card>
    );
}


export default Menu;