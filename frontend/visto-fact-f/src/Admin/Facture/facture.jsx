import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  message,
  Button,
  Table,
  DatePicker,
  Row,
  Col,
  Space,
  InputNumber,
} from "antd";
import axios from "axios";
import moment from "moment";
import "./facture.css";
import {
  CloseOutlined,
  EyeOutlined,
  PlusOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  PrinterOutlined,
  DollarCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

import Logo from "../../assets/images/visto.png";

import writtenNumber from "written-number";

// Configurer la bibliothèque pour utiliser le français
writtenNumber.defaults.lang = "fr";

const { Option } = Select;

const Facture = () => {
  const [form] = Form.useForm();
  const [clients, setClients] = useState([]);
  const [devises, setDevises] = useState([]);
  const [timbres, setTimbres] = useState([]);
  const [parametrages, setParametrages] = useState([]);
  const [services, setServices] = useState([]);
  const [tvaRates, setTvaRates] = useState([]); // Nouvel état pour stocker les taux de TVA
  const [selectedServices, setSelectedServices] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [factures, setFactures] = useState([]);
  const [totalHT, settotalHT] = useState(0);
  const [totalHTApresRemise, setTotalHTApresRemise] = useState(0);
  const [totalRemise] = useState(0); // Ajout de l'état pour le total de la remise
  const [totalTVA, setTotalTVA] = useState(0); // Ajoutez un état pour le total de la TVA
  const [totalTTC, setTotalTTC] = useState(0);
  const [tva, settva] = useState("");
  const [timbre, settimbre] = useState(parseFloat(""));
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [quantite, setQuantite] = useState(parseInt(""));
  const [paiement, setPaiement] = useState([]);

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [paymentMode, setPaymentMode] = useState(null);

  const [montantPaye, setMontantPaye] = useState(null);
  const [etatPaiement, setEtatPaiement] = useState("");
  const [chequePaymentStatus, setChequePaymentStatus] = useState(null);
  //const [chequeFields, setChequeFields] = useState([{ id: 1 }]);
  const [installments, setInstallments] = useState([{ id: 1 }]); // Stocke les échéances
  const [montantRestant, setMontantRestant] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const handleDeviseSelection = (value) => {
    const selectedServiceDevise =
      selectedServices.length > 0 ? selectedServices[0].devise.symbole : null; // Supposant que la devise du premier service est représentative

    const selectedDevise = devises.find((devise) => devise._id === value);

    if (
      selectedDevise &&
      selectedServiceDevise &&
      selectedDevise.symbole !== selectedServiceDevise
    ) {
      message.error(
        `La devise de la facture doit correspondre à celle des services sélectionnés (${selectedServiceDevise})`
      );
      form.setFieldsValue({ deviseid: null }); // Réinitialisation de la valeur du Select de la devise
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#fff",
      padding: 20,
    },
    section: {
      marginBottom: 20,
      padding: 10,
    },
    logo: {
      marginBottom: 10,
      width: "20%",
    },
    title: {
      fontSize: 20,
      color: "#14149f",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 2,
      marginLeft: "auto",
      marginRight: "auto",
      textDecoration: "underline",
      paddingBottom: 4,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 11,
      color: "#1b1b1b",
      fontWeight: "normal",
      marginBottom: 8,
    },
    table: {
      display: "table",
      width: "100%",
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "#bfbfbf",
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
    tableRow: {
      flexDirection: "row",
    },
    tableColHeader: {
      width: "15%",
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "#6696bd",
      borderLeftWidth: 0,
      borderTopWidth: 0,
      backgroundColor: "#84bdea",
    },
    tableCol: {
      width: "15%",
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "#bfbfbf",
      borderLeftWidth: 0,
      borderTopWidth: 0,
    },
    tableCellHeader: {
      margin: 5,
      fontSize: 10,
      fontWeight: "bold",
      textAlign: "center",
    },
    tableCell: {
      margin: 5,
      fontSize: 10,
      textAlign: "center",
    },

    totalsContainer: {
      flexDirection: "row",
      marginTop: 20,
      marginBottom: 10,
      justifyContent: "space-between",
    },
    totalsLeft: {
      width: "40%",
      marginRight: 10,
      textAlign: "right",
    },
    totalsRight: {
      width: "40%",
      marginLeft: 10,
    },
    totalsText: {
      fontSize: 10,
      marginBottom: 5,
      color: "#333",
    },
    totalsValue: {
      fontSize: 12,
      marginBottom: 5,
      color: "#555",
    },
    totalsTable: {
      marginLeft: 50,
      width: "80%",

      borderStyle: "solid",
    },
    totalsTableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: "#ccc",
    },
    totalsTableCell: {
      flex: 1,

      textAlign: "center",
      borderRightWidth: 1,
      borderColor: "#ccc",
    },
    totalsTableCellHeader: {
      flex: 1,

      textAlign: "center",
      borderRightWidth: 1,
      borderColor: "#ccc",
      backgroundColor: "#84bdea", // Couleur de fond pour les en-têtes de colonnes
      fontWeight: "bold", // Gras pour les en-têtes
    },
    totalsLastCell: {
      borderRightWidth: 0,
    },

    footerContainer: {
      textAlign: "center",
      borderTop: "2px solid #ddd",
      paddingTop: 10,
      marginTop: 200,
      fontSize: 10,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerText: {
      fontSize: 11.5,
    },
  });
  const showPrintModal = (record) => {
    setSelectedFacture(record); // Sélectionnez la facture pour l'impression
    setIsPrintModalVisible(true);
  };

  const handlePrintModalCancel = () => {
    setIsPrintModalVisible(false);
  };

  const addInstallment = () => {
    setInstallments([...installments, { id: installments.length + 1 }]);
  };

  const handleRemoveEcheance = (index) => {
    setInstallments((prevInstallments) =>
      prevInstallments.filter((_, i) => i !== index)
    );
  };

  const handlePaymentModeChange = (value) => {
    setPaymentMode(value);
    if (value === "espece") {
      const totalTTC = form.getFieldValue("totalTTC");
      setMontantPaye(totalTTC);
      setEtatPaiement("Payé");
      form.setFieldsValue({ montantPaye: totalTTC, etatpaiement: "Payé" });
    } else if (value === "cheque") {
      setMontantPaye(null);
      setEtatPaiement("");
      form.setFieldsValue({ montantPaye: null, etatpaiement: "" });
    } else {
      setMontantPaye(null);
      setEtatPaiement("");
      form.setFieldsValue({ montantPaye: null, etatpaiement: "" });
    }
  };

  const handleChequePaymentStatusChange = (value) => {
    setChequePaymentStatus(value);
    if (value === "Payé") {
      const totalTTC = form.getFieldValue("totalTTC");
      setMontantPaye(totalTTC);
      setEtatPaiement("Payé");
      form.setFieldsValue({ montantCheque: totalTTC, etatpaiement: "Payé" });
    } else {
      setMontantPaye(null);
      form.setFieldsValue({ montantPaye: null });
    }
  };

  const calculateRemainingAmount = () => {
    const totalTTC = form.getFieldValue("totalTTC");
    let montantChequeTotal = 0;

    installments.forEach((_, index) => {
      const montantCheque = form.getFieldValue(`montantCheque_${index}`);
      if (montantCheque) {
        montantChequeTotal += montantCheque;
      }
    });

    const montantRestant = totalTTC - montantChequeTotal;
    setMontantRestant(montantRestant);
  };
  useEffect(() => {
    calculateRemainingAmount();
  }, [installments, form]);

  // Créez une fonction pour ouvrir le modal de détails de la facture
  const showDetailModal = () => {
    setIsDetailModalVisible(true);
  };

  // Créez une fonction pour fermer le modal de détails de la facture
  const handleDetailModalCancel = () => {
    setIsDetailModalVisible(false);
  };

  // Dans la fonction showFactureDetails, mettez à jour l'état avec les détails de la facture sélectionnée et ouvrez le modal de détails de la facture
  const showFactureDetails = (record) => {
    setSelectedFacture(record);
    showDetailModal();
  };
  const [totalTTCLettre, setTotalTTCLettre] = useState(
    "Arrêtée la présente facture à la somme de 0"
  );

  const convertirEnLettres = (totalTTC) => {
    // Séparer la partie entière et la partie décimale
    const [partieEntiere, partieDecimale] = String(totalTTC).split(".");

    // Convertir la partie entière en lettres
    let enLettres = writtenNumber(partieEntiere);

    // Si la partie décimale existe, convertir aussi cette partie
    if (partieDecimale) {
      const partieDecimaleNombre = Number(`0.${partieDecimale}`) * 100; // Convertir la partie décimale en nombre
      enLettres += " virgule " + writtenNumber(partieDecimaleNombre);
    }

    // Retourner le résultat
    return enLettres;
  };
  useEffect(() => {
    setTotalTTCLettre(
      `Arrêtée la présente facture à la somme de ${convertirEnLettres(
        totalTTC
      )}`
    );
  }, [totalTTC]);

  useEffect(() => {
    fetchData();

    fetchPaiement();
  }, []);
  const fetchPaiement = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/paiements");
      setPaiement(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des paiements :", error);
    }
  };

  const fetchData = async () => {
    try {
      const clientsResponse = await axios.get(
        "http://localhost:5000/api/clients"
      );
      const filteredClients = clientsResponse.data.filter(
        (client) => client.status === true
      );
      setClients(filteredClients);

      const devisesResponse = await axios.get(
        "http://localhost:5000/api/devise"
      );
      const filteredDevises = devisesResponse.data.filter(
        (devise) => devise.status === true
      );
      setDevises(filteredDevises);

      const timbresResponse = await axios.get(
        "http://localhost:5000/api/timbre"
      );
      const filteredTimbres = timbresResponse.data.filter(
        (timbre) => timbre.status === true
      );
      setTimbres(filteredTimbres);

      const parametragesResponse = await axios.get(
        "http://localhost:5000/api/parametrage"
      );
      const filteredParametrages = parametragesResponse.data.filter(
        (parametrage) => parametrage.status === true
      );
      setParametrages(filteredParametrages);

      const servicesResponse = await axios.get(
        "http://localhost:5000/api/services"
      );
      let services = servicesResponse.data.filter(
        (e) => e.categories != null && e.status === true
      );

      setServices(services);

      const tvaResponse = await axios.get("http://localhost:5000/api/tva");
      const filteredTvaRates = tvaResponse.data.filter(
        (tvaRate) => tvaRate.status === true
      );
      setTvaRates(filteredTvaRates);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchFacture();
  }, [searchQuery]);
  const fetchFacture = async () => {
    try {
      let url = "http://localhost:5000/api/facture";
      if (searchQuery) {
        url += `/search/${searchQuery}`;
      }
      const facturesResponse = await axios.get(url);
      setFactures(facturesResponse.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des factures :", error);
      // Gérer l'erreur ou afficher un message d'erreur à l'utilisateur
    }
  };

  const handleAddService = (value) => {
    const serviceToAdd = services.find((service) => service._id === value);
    if (
      serviceToAdd &&
      !selectedServices.find((service) => service._id === value)
    ) {
      setSelectedServices([...selectedServices, serviceToAdd]);

      const newSubtotalHT = calculateNewSubtotal([
        ...selectedServices,
        serviceToAdd,
      ]);
      settotalHT(newSubtotalHT);

      const totalHTAfterDiscount = calculateTotalHTApresRemise([
        ...selectedServices,
        serviceToAdd,
      ]);
      setTotalHTApresRemise(totalHTAfterDiscount);

      // Mettre à jour le formulaire
      form.setFieldsValue({ totalHT: newSubtotalHT });
      form.setFieldsValue({ totalHTApresRemise: totalHTAfterDiscount });
    }
  };
  // Utilisez useEffect pour recalculer le total de la TVA lorsque les valeurs changent
  useEffect(() => {
    calculateTotalTVA();
  }, [selectedServices]); // Surveiller les changements de la TVA et des services sélectionnés

  const handleColumnChange = (value, key, dataIndex) => {
    const updatedSelectedServices = selectedServices.map((service) => {
      if (service._id === key) {
        const updatedService = {
          ...service,
          [dataIndex]:
            dataIndex === "tva" ? findTvaIdByRate(value) : parseFloat(value),
        };

        if (
          dataIndex === "quantite" ||
          dataIndex === "prix_unitaire" ||
          dataIndex === "remise"
        ) {
          updatedService.montant_ht = calculateMontantHT(updatedService);
        }

        return updatedService;
      }
      return service;
    });

    setSelectedServices(updatedSelectedServices); // Mettre à jour les services sélectionnés

    // Recalculer les totaux
    const newSubtotalHT = calculateNewSubtotal(updatedSelectedServices);
    settotalHT(newSubtotalHT);

    const totalHTAfterDiscount = calculateTotalHTApresRemise(
      updatedSelectedServices
    );
    setTotalHTApresRemise(totalHTAfterDiscount);

    // Recalculer le total de la TVA et stocker les totaux par service
    const totalTVAs = calculateTotalTVA();

    // Afficher la somme des totaux de TVA dans la console pour vérification
    console.log("Total TVAs:", totalTVAs);

    form.setFieldsValue({ totalHT: newSubtotalHT });
    form.setFieldsValue({ totalHTApresRemise: totalHTAfterDiscount });
  };

  const calculateTotalTVA = () => {
    const totalTVAs = {}; // Créez un objet pour stocker les totaux de TVA par service

    selectedServices.forEach((service) => {
      const montantHT =
        parseFloat(
          service.prix_unitaire * service.quantite -
            (service.prix_unitaire * service.quantite * service.remise) / 100
        ) || 0;
      const tvaRate = tva || 0;

      if (tvaRate) {
        const tva = (montantHT * tvaRate) / 100;
        totalTVAs[service._id] = tva;
      }
    });

    // Calculez la somme des totaux de TVA
    const totalTVAA = Object.values(totalTVAs).reduce(
      (acc, cur) => acc + cur,
      0
    );

    setTotalTVA(totalTVAA);
    form.setFieldsValue({ totalTVA: totalTVAA });

    // Retournez l'objet totalTVAs si vous souhaitez l'utiliser ailleurs dans votre application
    return totalTVAs;
  };

  console.log(calculateTotalTVA);
  const findTvaIdByRate = (rate) => {
    // Rechercher la TVA correspondant au taux de TVA
    const tva = tvaRates.find((tva) => tva.rate === rate);
    return tva ? tva._id : null; // Renvoyer l'ID de la TVA si elle est trouvée, sinon null
  };

  const handleCreate = async (values) => {
    try {
      // Calculer totalTTCLettre en fonction de totalTTC (ou d'autres valeurs si nécessaire)
      const totalTTCLettre = convertirEnLettres(values.totalTTC);

      // Créer le payload pour la création de la facture
      const payload = {
        clientid: values.clientid,
        parametrageid: values.parametrageid,
        deviseid: values.deviseid,
        timbreid: timbre ? timbre : null,
        totalTTCLettre,
        totalHT: parseFloat(values.totalHT),
        totalRemise: values.totalRemise,
        totalHTApresRemise: parseFloat(values.totalHTApresRemise).toFixed(3),
        totalTVA: values.totalTVA,
        totalTTC: values.totalTTC,
        services: selectedServices.map((service) => ({
          _id: service._id,
          reference: service.reference,
          libelle: service.libelle,
          tva: service.tva,
          unite: service.unite,
          quantite: service.quantite,
          prix_unitaire: service.prix_unitaire,
          remise: service.remise,
          montant_ht: service.montant_ht,
        })),
      };

      // Créer la facture
      const factureResponse = await axios.post(
        "http://localhost:5000/api/facture/fact",
        payload
      );

      // Récupérer l'ID du client sélectionné
      const clientId = payload.clientid;

      // Récupérer le numéro de la facture à partir de la réponse
      const numeroFacture = factureResponse.data.numeroFacture;

      // Créer la notification pour la facture créée
      const notificationData = {
        type: "FactureCréée",
        notif: `Nous vous informons que votre facture numéro ${numeroFacture} est maintenant disponible.`,
        client: clientId,
      };

      // Envoyer la notification
      const notificationResponse = await axios.post(
        "http://localhost:5000/api/notifications",
        notificationData
      );
      console.log("Notification créée:", notificationResponse.data);

      // Afficher un message de succès
      message.success("Facture créée avec succès !");

      // Réinitialiser le formulaire et les services sélectionnés
      form.resetFields();
      setSelectedServices([]);
      form.setFieldsValue({ totalHT: null });
      form.setFieldsValue({ totalHTApresRemise: null });
      form.setFieldsValue({ totalTVA: null });
      form.setFieldsValue({ totalTVAA: null });
      setIsModalVisible(false);
      fetchFacture();
    } catch (error) {
      console.error("Erreur lors de la création de la facture :", error);
      message.error(
        "Une erreur s'est produite lors de la création de la facture."
      );
    }
  };

  const calculateNewSubtotal = (newSelectedServices) => {
    // Calculer le Sous-Total HT en parcourant les services sélectionnés
    const totalHT = newSelectedServices.reduce((accumulator, service) => {
      const montantHT =
        parseFloat(service.quantite) * parseFloat(service.prix_unitaire);
      return accumulator + montantHT;
    }, 0);

    return totalHT.toFixed(3); // Formater avec 3 chiffres après la virgule
  };

  const calculateTotalHTApresRemise = (newSelectedServices) => {
    // Calculer le Total HT après remise en parcourant les services sélectionnés
    const totalHTApresRemise = newSelectedServices.reduce(
      (accumulator, service) => {
        const montantHT =
          parseFloat(service.quantite) * parseFloat(service.prix_unitaire);
        const remise = parseFloat(service.remise) || 0;
        const montantHTApresRemise = montantHT * (1 - remise / 100); // Appliquer la remise
        return accumulator + montantHTApresRemise;
      },
      0
    );

    return parseFloat(totalHTApresRemise).toFixed(3);
  };

  const calculateMontantHT = (record) => {
    const quantite = record.quantite || 0;
    const prix_unitaire = record.prix_unitaire || 0;
    const remise = record.remise || 0;
    const montantHT = (quantite * prix_unitaire * (100 - remise)) / 100;
    return parseFloat(montantHT.toFixed(3)); // Renvoie le montant HT avec 3 chiffres après la virgule
  };

  useEffect(() => {
    // Calculer la remise totale
    const calculateTotalRemise = () => {
      const totalHT = parseFloat(form.getFieldValue("totalHT"));
      const totalHTApresRemise = parseFloat(
        form.getFieldValue("totalHTApresRemise")
      );
      const remise = totalHT - totalHTApresRemise;
      form.setFieldsValue({ totalRemise: remise.toFixed(3) });
    };

    // Appeler la fonction pour calculer la remise totale
    calculateTotalRemise();
  }, [selectedServices, form]);

  function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const columns = [
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      width: 130,
      render: (_, record) => record.reference,
    },

    {
      title: "Désignation",
      dataIndex: "libelle",
      key: "libelle",
      width: 130,
      render: (_, record) => record.libelle,
    },

    {
      title: "Unité",
      dataIndex: "unite",
      key: "unite",
      width: 130,
      render: (_, record) => record.unite,
    },
    {
      title: "TVA",
      dataIndex: "tva",
      key: "tva",
      width: 140,
      render: (_, record) => (
        <Select
          onChange={(value) => {
            handleColumnChange(value, record._id, "tva"),
              settva(value),
              calculateTotalTVA(value);
            console.log("val", totalTVA);
          }}
          style={{ width: "70px" }}
        >
          {tvaRates.map((tva) => (
            <Option key={tva._id} value={tva.rate}>
              {tva.rate}%
            </Option>
          ))}
        </Select>
      ),
    },

    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantite",
      width: 100,
      fontSize: 10,
      render: (_, record) => (
        <Input
          type="number"
          defaultValue={record.quantite}
          onChange={(e) => {
            console.log("aaaaaa", e.target.value);

            setQuantite(e.target.value);

            handleColumnChange(e.target.value, record._id, "quantite");
          }}
          // onBlur={(e) =>
          //   handleColumnChange(e.target.value, record._id, "quantite")
          // }
          style={{ width: "100%" }}
        />
      ),
    },

    {
      title: "Prix Unitaire",
      dataIndex: "prix_unitaire",
      key: "prix_unitaire",
      width: 130,
      render: (_, record) => record.prix_unitaire,
    },
    {
      title: "Remise(%)",
      dataIndex: "remise",
      key: "remise",
      width: 70,

      render: (_, record) => (
        <Input
          type="number"
          defaultValue={record.remise}
          onBlur={(e) =>
            handleColumnChange(e.target.value, record._id, "remise")
          }
          style={{ width: "90%" }}
        />
      ),
    },
    {
      title: "Montant HT",
      dataIndex: "montant_ht",
      key: "montant_ht",

      render: (_, record) => record.montant_ht, // Utilisez la valeur du montant HT du service
    },
    {
      title: "Devise",
      dataIndex: "devise",
      key: "devise",
      width: 100,
      render: (_, record) => (
        <span>{record.devise && record.devise.symbole}</span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 40,
      render: (_, record) => (
        <Button
          type="link"
          danger
          style={{ background: "transparent", fontSize: 15 }}
          onClick={() => handleDeleteService(record._id)}
        >
          <CloseOutlined />
        </Button>
      ),
    },
  ];

  const handleDeleteService = (id) => {
    // Mettez à jour l'état selectedServices en supprimant le service supprimé
    const updatedSelectedServices = selectedServices.filter(
      (service) => service._id !== id
    );
    setSelectedServices(updatedSelectedServices);

    // Recalculer les totaux et mettre à jour le formulaire
    const newSubtotalHT = calculateNewSubtotal(updatedSelectedServices);
    settotalHT(newSubtotalHT);

    const totalHTAfterDiscount = calculateTotalHTApresRemise(
      updatedSelectedServices
    );
    setTotalHTApresRemise(totalHTAfterDiscount);

    // Recalculer la TVA totale
    calculateTotalTVA();

    // Recalculer le total TTC si un timbre est sélectionné
    if (form.getFieldValue("timbreid")) {
      calculateTotalTTC();
    }

    // Recalculer la remise totale en fonction des nouveaux totaux
    const totalRemise = newSubtotalHT - totalHTAfterDiscount;
    form.setFieldsValue({ totalRemise: totalRemise.toFixed(3) });

    // Mettez à jour les valeurs des champs dans le formulaire
    form.setFieldsValue({ totalHT: newSubtotalHT });
    form.setFieldsValue({ totalHTApresRemise: totalHTAfterDiscount });
  };

  const calculateTotalTTC = () => {
    const totalHTApresRemise =
      parseFloat(form.getFieldValue("totalHTApresRemise")) || 0;
    const totalTVA = parseFloat(form.getFieldValue("totalTVA")) || 0;
    const timbreId = form.getFieldValue("timbreid"); // Obtenez l'ID du timbre sélectionné dans le formulaire

    // Recherchez l'objet Timbre correspondant à l'ID
    const selectedTimbre = timbres.find((timbre) => timbre._id === timbreId);

    // Obtenez la valeur du timbre à partir de l'objet trouvé
    const timbreValue = selectedTimbre ? parseFloat(selectedTimbre.value) : 0;

    // Calculer le total TTC en ajoutant le total HT après remise, le total de la TVA et le montant du timbre
    const totalTTCA = totalHTApresRemise + totalTVA + timbreValue;

    // Mettre à jour l'état du total TTC
    setTotalTTC(totalTTCA.toFixed(3));
    form.setFieldsValue({ totalTTC: totalTTCA.toFixed(3) });
  };

  // Utilisez useEffect pour recalculer le total TTC lorsque les valeurs changent
  useEffect(() => {
    calculateTotalTTC();
  }, [
    form.getFieldValue("totalHTApresRemise"),
    form.getFieldValue("totalTVA"),
    form.getFieldValue("timbreid"),
    timbre,

    quantite,
  ]);

  const handleEdit = (record) => {
    const paiementAssocie = paiement.find((p) =>
      p.factures.includes(record._id)
    );

    if (
      paiementAssocie &&
      (paiementAssocie.etatpaiement === "Payé" ||
        paiementAssocie.etatpaiement === "partiellementPayé")
    ) {
      message.error(
        "Cette facture est déjà payée ou partiellement payée et ne peut pas être modifiée."
      );
      return;
    }

    setIsEditing(record);
    setIsModalVisible(true);

    // Remplir le formulaire avec les valeurs du record
    form.setFieldsValue({
      totalTTC: record.totalTTC,
      deviseid: record.devise.symbole,
      clientid: record.client.name,
      numeroFacture: record.numeroFacture,
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Vérification du montant restant
      if (
        montantRestant !== 0 &&
        values.etatpaiement === "Partiellement Payé"
      ) {
        message.error(
          "Le montant restant doit être égal à 0 pour créer le paiement"
        );
        return;
      }

      // Construction des données de paiement à envoyer
      const paymentData = {
        etatpaiement: values.etatpaiement,
        montantPaye: values.montantPaye,
        typepaiement: values.typepaiement,
        factures: isEditing ? isEditing._id : null,
        echeances:
          chequePaymentStatus === "Payé"
            ? [
                {
                  numCheque: values.numCheque,
                  montantCheque: values.montantCheque,
                  dateCh: moment(values.dateCh).toISOString(),
                },
              ]
            : installments.map((installment, index) => ({
                numCheque: values[`numCheque_${index}`],
                montantCheque: values[`montantCheque_${index}`],
                dateCh: moment(values[`dateCh_${index}`]).toISOString(),
              })),
      };

      console.log("Payment Data:", paymentData);

      // Envoi de la requête de création de paiement
      const response = await axios.post(
        "http://localhost:5000/api/paiements",
        paymentData
      );

      if (response.status === 201) {
        message.success("Paiement créé avec succès!");
        form.resetFields();

        // Réinitialisation des états du formulaire
        setPaymentMode("");
        setChequePaymentStatus("");
        setInstallments([]);
        setIsModalVisible(false);
        setIsEditing(false);

        // Rafraîchissement des paiements et factures
        fetchPaiement();
        fetchFacture();
      } else {
        message.error("Erreur lors de la création du paiement");
      }

      await submitNotification(
        isEditing.client._id,
        isEditing.numeroFacture,
        paymentData.etatpaiement
      );
    } catch (error) {
      console.error("Erreur lors de la création du paiement:", error);
      message.error("Erreur lors de la création du paiement");
    }
  };

  const submitNotification = async (clientId, numeroFacture, etatpaiement) => {
    try {
      const notificationData = {
        type: "PaiementRéglé",
        notif: `Votre facture numero : ${numeroFacture} est ${etatpaiement}`,
        client: clientId,
      };

      const response = await axios.post(
        "http://localhost:5000/api/notifications",
        notificationData
      );
      console.log("Notification créée:", response.data);
      message.success("Notification sent successfully");
    } catch (error) {
      console.error("Failed to send notification", error);
      message.error("Failed to send notification.");
    }
  };

  const columnsFact = [
    {
      title: "Numéro Facture",
      dataIndex: "numeroFacture",
      key: "numeroFacture",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => {
        // Convertir la date en objet Date si elle est sous forme de chaîne
        const dateObj = new Date(date);
        // Extraire les parties de la date
        const jour = dateObj.getDate();
        const mois = dateObj.getMonth() + 1; // Les mois sont indexés à partir de zéro, donc ajoutez 1
        const annee = dateObj.getFullYear();
        // Formater la date dans le format souhaité
        const dateFormatee = `${jour < 10 ? "0" : ""}${jour}/${
          mois < 10 ? "0" : ""
        }${mois}/${annee}`;
        // Retourner la date formatée
        return dateFormatee;
      },
    },
    {
      title: "Société",
      dataIndex: "parametrage",
      key: "parametrage",
      render: (parametrage) => parametrage.nomEntreprise,
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      render: (client) =>
        client ? `${client.name} (${client.namecompany})` : "Client inconnu",
    },

    {
      title: "Total TTC",
      dataIndex: "totalTTC",
      key: "totalTTC",
    },
    {
      title: "Devise",
      dataIndex: "devise",
      key: "devise",
      render: (devise) => devise.symbole,
    },
    {
      title: "État Paiement",
      key: "etatpaiement",
      render: (record) => renderEtatPaiement(record),
    },
    {
      title: "Type Paiement",
      dataIndex: "typePaiement",
      key: "typePaiement",
      render: (typePaiement, record) => {
        const paiementAssocie = paiement.find((p) =>
          p.factures.includes(record._id)
        );

        if (paiementAssocie) {
          return paiementAssocie.typepaiement || "En cours";
        }
        return "En cours";
      },
    },
    {
      title: "Date Paiement",
      dataIndex: "datePaiement",
      key: "datePaiement",
      render: (datePaiement, record) => {
        const paiementAssocie = paiement.find((p) =>
          p.factures.includes(record._id)
        );

        if (paiementAssocie && paiementAssocie.datepaiement) {
          const formattedDate = new Date(
            paiementAssocie.datepaiement
          ).toLocaleDateString();
          return formattedDate;
        }
        return "En cours";
      },
    },

    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {/* Bouton "Eye" */}
          <button
            style={{
              backgroundColor: "#3F51B5", // Fond bleu roi
              color: "#FFFFFF", // Texte blanc
              border: "none",
              borderRadius: "50%",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)", // Ombre plus prononcée
            }}
            onClick={() => showFactureDetails(record)}
          >
            <EyeOutlined style={{ fontSize: "18px" }} />
          </button>

          {/* Bouton "DollarCircle" */}
          <button
            style={{
              backgroundColor: "#e24947", // Fond rouge vif
              color: "#FFFFFF", // Texte blanc
              border: "none",
              borderRadius: "50%",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)", // Ombre plus prononcée
              opacity: paiement.some(
                (p) =>
                  p.factures.includes(record._id) &&
                  (p.etatpaiement === "Payé" ||
                    p.etatpaiement === "partiellementPayé")
              )
                ? "0.5"
                : "1",
            }}
            onClick={() => handleEdit(record)}
            disabled={paiement.some(
              (p) =>
                p.factures.includes(record._id) &&
                (p.etatpaiement === "Payé" ||
                  p.etatpaiement === "partiellementPayé")
            )}
          >
            <DollarCircleOutlined />
          </button>

          {/* Bouton "Printer" */}
          <button
            style={{
              backgroundColor: "#5f616b", // Fond bleu roi
              color: "#FFFFFF", // Texte blanc
              border: "none",
              borderRadius: "50%",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)", // Ombre plus prononcée
            }}
            onClick={() => showPrintModal(record)}
          >
            <PrinterOutlined style={{ fontSize: "20px" }} />
          </button>
        </Space>
      ),
    },
  ];

  const renderEtatPaiement = (record) => {
    const paiementAssocie = paiement.find((p) =>
      p.factures.includes(record._id)
    );
    let icon;
    let text;

    if (paiementAssocie) {
      const etatpaiement = paiementAssocie.etatpaiement;

      if (etatpaiement === "Payé") {
        icon = <CheckCircleOutlined style={{ color: "green" }} />;
        text = "Payé";
      } else if (etatpaiement === "partiellementPayé") {
        icon = <WarningOutlined style={{ color: "yellow" }} />;
        text = "Partiellement Payé";
      } else {
        icon = <ExclamationCircleOutlined style={{ color: "red" }} />;
        text = "Non Payé";
      }
    } else {
      // Si aucun paiement associé n'est trouvé
      icon = <ExclamationCircleOutlined style={{ color: "red" }} />;
      text = "Non Payé";
    }

    return (
      <span>
        {icon} {text}
      </span>
    );
  };
  return (
    <div>
      <Button
        type="primary"
        onClick={() => setIsModalVisible(true)}
        icon={<PlusOutlined />}
        style={{
          display: "flex",
          alignItems: "center",
          height: 35,
          paddingLeft: 10,
          paddingRight: 5,
          borderRadius: 5,
          width: "175px",
          backgroundColor: "#232492", // Couleur de fond personnalisée
          border: "none",
          float: "right",
          color: "#fff", // Couleur du texte
          marginBottom: 30,
        }}
      >
        <span style={{ fontWeight: "bold", fontSize: 14 }}>
          Ajouter Facture
        </span>
      </Button>

      <Input
        prefix={<SearchOutlined style={{ color: "#8f8fa1" }} />}
        placeholder="Rechercher ..."
        style={{
          width: 250,
          marginRight: 8,
          height: 35,
          borderRadius: 10, // Ajoute des coins arrondis pour un aspect plus moderne
          boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)", // Ajoute une ombre subtile
        }}
        onChange={(e) => handleSearch(e.target.value)}
      />

      <Table
        dataSource={factures}
        columns={columnsFact}
        rowKey="_id"
        bordered
        pagination={{ pageSize: 10 }}
        style={{
          marginTop: "50px",
          borderRadius: "8px",
          border: "1px solid #e8e8e8",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
        className="custom-table"
      />
      <Modal
        title={
          <span
            style={{
              color: "#0a0a85",
              fontSize: "25px",
              fontWeight: "bold",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            {isEditing ? "Ajouter  un état paiement" : "Ajouter une facture"}
          </span>
        }
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields(); // Réinitialisez les champs du formulaire
          setSelectedServices([]);

          form.setFieldsValue({ totalHT: null });
          form.setFieldsValue({ totalHTApresRemise: null });
          form.setFieldsValue({ totalTVA: null });
          form.setFieldsValue({ totalTVAA: null });
          setPaymentMode("");
          setChequePaymentStatus("");

          setIsEditing(false); // Désactivez le mode d'édition
        }}
        footer={null}
        width={isEditing ? 1000 : 1000}
        style={{ top: 10 }}
        bodyStyle={{
          background:
            "linear-gradient(to bottom,rgba(255, 255, 255, 0.9),  rgba(255, 255, 255, 0.9))",
        }}
      >
        <Form
          form={form}
          layout="inline"
          onFinish={isEditing ? handleSubmit : handleCreate}
          style={{ marginTop: 10, marginRight: 20 }}
        >
          {!isEditing && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  style={{ marginTop: 10 }}
                  label="Société"
                  name="parametrageid"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner une société !",
                    },
                  ]}
                >
                  <Select
                    style={{ width: "200px" }}
                    placeholder="Sélectionner une société"
                  >
                    {parametrages.map((parametrage) => (
                      <Option key={parametrage._id} value={parametrage._id}>
                        {parametrage.nomEntreprise}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  style={{ marginTop: 10, marginLeft: -25 }}
                  label="Client"
                  name="clientid"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner un client !",
                    },
                  ]}
                >
                  <Select
                    style={{ width: "300px" }}
                    placeholder="Sélectionner un client"
                  >
                    {clients.map((client) => (
                      <Option key={client._id} value={client._id}>
                        {`${client.name} (${client.namecompany})`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
          {!isEditing && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Date " name="date" initialValue={moment()}>
                  <DatePicker
                    style={{ width: "200px" }}
                    defaultValue={moment()}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
          {!isEditing && (
            <Row gutter={16} style={{ width: "100%", marginTop: 10 }}>
              <Col span={12}>
                <Form.Item
                  label="Services"
                  name="services"
                  style={{ marginLeft: -30 }}
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner un service !",
                    },
                  ]}
                >
                  <Select
                    style={{ width: "400px" }}
                    placeholder="Sélectionner un service"
                    onSelect={handleAddService}
                  >
                    {services.map((service) => (
                      <Select.Option key={service._id} value={service._id}>
                        {service.libelle}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  style={{ marginLeft: 50 }}
                  label="Devise"
                  name="deviseid"
                  rules={[
                    {
                      required: true,
                      message:
                        "Veuillez sélectionner une devise pour la facture !",
                    },
                  ]}
                >
                  <Select
                    style={{ width: "200px" }}
                    placeholder="Sélectionnez la devise"
                    onChange={handleDeviseSelection}
                  >
                    {devises.map((devise) => (
                      <Select.Option key={devise._id} value={devise._id}>
                        {` (${devise.symbole})`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {isEditing && (
            <>
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: "18px",
                    marginBottom: "10px",
                    color: "#363637",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    Numéro de facture :
                  </span>{" "}
                  {form.getFieldValue("numeroFacture")}
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    marginBottom: "10px",
                    color: "#423f3f",
                    fontFamily: "Poppins",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Client :</span>{" "}
                  {form.getFieldValue("clientid")}
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    marginBottom: "10px",
                    color: "#313030",
                    fontFamily: "Poppins",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Montant total :</span>{" "}
                  {form.getFieldValue("totalTTC")}{" "}
                  {form.getFieldValue("deviseid")}
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    marginBottom: "10px",
                    color: "#666",
                  }}
                >
                  Veuillez sélectionner un mode de paiement pour finaliser cette
                  transaction.
                </p>
              </div>

              <Row gutter={16} style={{ marginBottom: 20, marginLeft: -10 }}>
                <Col span={12}>
                  <Form.Item
                    label="Mode de paiement"
                    name="typepaiement"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez choisir un mode de paiement!",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Mode de paiement"
                      onChange={handlePaymentModeChange}
                      style={{ width: "180px", marginLeft: 5 }}
                    >
                      <Option value="espece">Espèces</Option>
                      <Option value="cheque">Chèque</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Date"
                    name="dateEcheance"
                    initialValue={moment()}
                  >
                    <DatePicker style={{ width: "200px" }} />
                  </Form.Item>
                </Col>
              </Row>

              {paymentMode === "espece" && (
                <>
                  <Row gutter={16} style={{ marginBottom: 20 }}>
                    <Col span={12}>
                      <Form.Item
                        style={{ marginLeft: 20 }}
                        label="Montant Payé"
                        name="montantPaye"
                      >
                        <InputNumber
                          style={{ width: "140px" }}
                          value={montantPaye}
                          readOnly
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        style={{ marginLeft: 20 }}
                        label="État de paiement"
                        name="etatpaiement"
                      >
                        <Input
                          style={{ width: "140px" }}
                          value={etatPaiement}
                          readOnly
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}
              {paymentMode === "cheque" && (
                <>
                  <Row gutter={16} style={{ marginBottom: 20 }}>
                    <Col span={12}>
                      <Form.Item
                        label="Statut de paiement"
                        name="etatpaiement"
                        labelCol={{ span: 22 }}
                        rules={[
                          {
                            required: true,
                            message: "Veuillez choisir un statut de paiement!",
                          },
                        ]}
                      >
                        <Select
                          placeholder="Statut de paiement"
                          onChange={handleChequePaymentStatusChange}
                          style={{ width: "200px", marginLeft: 5 }}
                        >
                          <Option value="Payé">Payé</Option>
                          <Option value="partiellementPayé">
                            Partiellement payé
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {chequePaymentStatus === "Payé" && (
                    <Row gutter={16} style={{ marginBottom: 20 }}>
                      <Col span={8} style={{ marginLeft: -20 }}>
                        <Form.Item
                          label="Numéro"
                          name="numCheque"
                          rules={[
                            {
                              required: true,
                              message: "Veuillez entrer le numéro de chèque!",
                            },
                          ]}
                        >
                          <Input style={{ width: "200px" }} />
                        </Form.Item>
                      </Col>
                      <Col span={8} style={{ marginLeft: 10 }}>
                        <Form.Item
                          label="Montant"
                          name="montantCheque"
                          rules={[
                            {
                              required: true,
                              message: "Veuillez entrer le montant du chèque!",
                            },
                          ]}
                        >
                          <InputNumber
                            style={{ width: "180px" }}
                            value={montantPaye}
                            readOnly
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8} style={{ marginLeft: 10 }}>
                        <Form.Item
                          label="Date Chèque "
                          name="dateCh"
                          s
                          initialValue={moment()}
                          rules={[
                            {
                              required: true,
                              message:
                                "Veuillez sélectionner la date du chèque!",
                            },
                          ]}
                        >
                          <DatePicker style={{ width: "150px" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}

                  {chequePaymentStatus === "partiellementPayé" && (
                    <>
                      {installments.map((installment, index) => (
                        <Row
                          gutter={16}
                          style={{ marginBottom: 20 }}
                          key={installment.id} // Utilisation de field.id comme clé unique
                        >
                          <Col span={8} style={{ marginLeft: -20 }}>
                            <Form.Item
                              label="Numéro"
                              name={`numCheque_${index}`}
                              rules={[
                                {
                                  required: true,
                                  message:
                                    "Veuillez entrer le numéro de chèque!",
                                },
                              ]}
                            >
                              <Input style={{ width: "200px" }} />
                            </Form.Item>
                          </Col>
                          <Col span={8} style={{ marginLeft: -10 }}>
                            <Form.Item
                              label="Montant"
                              name={`montantCheque_${index}`}
                              rules={[
                                {
                                  required: true,
                                  message:
                                    "Veuillez entrer le montant du chèque!",
                                },
                              ]}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                onChange={() => calculateRemainingAmount()}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={8} style={{ marginLeft: -50 }}>
                            <Form.Item
                              label="Date"
                              name={`dateCh_${index}`}
                              initialValue={moment()}
                              rules={[
                                {
                                  required: true,
                                  message:
                                    "Veuillez sélectionner la date du chèque!",
                                },
                              ]}
                            >
                              <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col span={2}>
                            <Button
                              type="link"
                              onClick={() => handleRemoveEcheance(index)}
                              icon={<CloseOutlined />}
                              style={{ color: "red" }}
                            />
                          </Col>
                        </Row>
                      ))}
                      <Button
                        type="dashed"
                        onClick={addInstallment}
                        style={{
                          width: "20%",
                          marginBottom: "20px",
                          backgroundColor: "#2b64a5", // Couleur de fond du bouton (vert)
                          borderColor: "#1d599f", // Couleur de bordure du bouton
                          color: "white", // Couleur du texte
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Effet d'ombre légère
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>+</span> Ajouter un
                        autre chèque
                      </Button>
                      <p
                        style={{
                          marginTop: 20,
                          marginLeft: 500,
                          fontSize: "14px", // Taille de la police agrandie
                          fontWeight: "bold", // Texte en gras
                          color: "#2b64a5", // Couleur du texte en bleu foncé
                          padding: "10px", // Ajout d'espace autour du texte
                          border: "2px solid #2b64a5", // Bordure de 2 pixels en bleu foncé
                          borderRadius: "10px", // Coins arrondis
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Ombre pour l'effet 3D
                          textAlign: "center", // Texte centré
                          backgroundColor: "#f0f8ff", // Couleur de fond légère
                        }}
                      >
                        Montant restant: {montantRestant}
                      </p>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {!isEditing && (
            <Table
              className="custom-table"
              dataSource={selectedServices}
              columns={columns}
              rowKey="id"
              pagination={false}
              style={{ marginBottom: 16, width: "100%" }}
              bordered
              scroll={{ x: "100%" }}
            />
          )}
          {!isEditing && (
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <p>{totalTTCLettre}</p>
                </div>
              </Col>
              <Col span={12}>
                <div
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    padding: "10px",
                    marginLeft: 74,
                    marginTop: -15,
                  }}
                >
                  <Form.Item
                    label="Sous-Total HT"
                    name="totalHT"
                    initialValue={totalHT}
                  >
                    <Input
                      type="number"
                      value={totalHT}
                      style={{ backgroundColor: "#f0f0f0" }}
                      readOnly
                    />
                  </Form.Item>

                  <Form.Item label="Remise" name="totalRemise">
                    <Input
                      type="number"
                      value={totalRemise}
                      readOnly
                      style={{ backgroundColor: "#f0f0f0" }}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Total HT après Remise"
                    name="totalHTApresRemise"
                    initialValue={totalHTApresRemise}
                  >
                    <Input
                      type="number"
                      value={totalHT}
                      style={{ backgroundColor: "#f0f0f0" }}
                      readOnly
                    />
                  </Form.Item>
                  <Form.Item label="Total TVA" name="totalTVA">
                    <Input
                      type="number"
                      placeholder="Total TVA"
                      readOnly
                      value={totalTVA}
                      style={{ backgroundColor: "#f0f0f0" }}
                    />
                  </Form.Item>

                  <Form.Item label="Timbre Fiscal" name="timbreid">
                    <Select
                      onChange={(value) => {
                        settimbre(value);
                      }}
                      style={{ backgroundColor: "#f0f0f0" }}
                    >
                      {timbres.map((timbre) => (
                        <Option key={timbre._id} value={timbre._id}>
                          {timbre.value.toFixed(3)}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="Total TTC" name="totalTTC">
                    <Input
                      type="number"
                      placeholder="Total TTC"
                      value={totalTTC}
                      readOnly
                      style={{ backgroundColor: "#f0f0f0" }}
                    />
                  </Form.Item>
                </div>
              </Col>
            </Row>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 20,
              marginLeft: 300,
            }}
          >
            <Button
              type="default"
              style={{
                backgroundColor: "red",
                color: "white",
                marginRight: 10,
                width: "120px",
                fontSize: "14px",
              }}
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields(); // Réinitialiser les champs du formulaire
                setSelectedServices([]); // Réinitialiser les services sélectionnés
                setIsEditing(false); // Désactivez le mode d'édition

                form.setFieldsValue({ totalHT: null });
                form.setFieldsValue({ totalHTApresRemise: null });
                form.setFieldsValue({ totalTVA: null });
                form.setFieldsValue({ totalTVAA: null });
                setPaymentMode("");
                setChequePaymentStatus("");
                setInstallments([]);
              }}
            >
              Annuler
            </Button>

            <Form.Item style={{ marginRight: "8px", marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                className="create-butto"
                style={{
                  background: "#4CAF50",
                  borderColor: "#4CAF50",
                  width: "130px",
                  height: "30px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Valider
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Modal>
      <Modal
        visible={isDetailModalVisible}
        onCancel={handleDetailModalCancel}
        footer={
          <div
            style={{
              textAlign: "center",
              borderTop: "2px solid #ddd",
              padding: "20px",
              backgroundColor: "#f7f7f7",
              borderRadius: "8px",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1", margin: "5px", marginLeft: "-30px" }}>
                <p style={{ marginBottom: "10px", fontSize: "16px" }}>
                  <span style={{ fontWeight: "bold" }}>M.F: </span>
                  {selectedFacture &&
                  selectedFacture.parametrage &&
                  selectedFacture.parametrage.matriculefiscal
                    ? selectedFacture.parametrage.matriculefiscal
                    : "-"}
                </p>
              </div>
              <div style={{ flex: "1", margin: "5px", marginLeft: "-35px" }}>
                <p style={{ marginBottom: "10px", fontSize: "16px" }}>
                  <PhoneOutlined style={{ marginRight: "5px" }} />
                  {selectedFacture && selectedFacture.parametrage
                    ? selectedFacture.parametrage.phonenumber
                    : "-"}
                </p>
              </div>

              <div style={{ flex: "1", margin: "5px", marginLeft: "-25px" }}>
                <p style={{ marginBottom: "10px", fontSize: "14px" }}>
                  <MailOutlined style={{ marginRight: "5px" }} />
                  {selectedFacture && selectedFacture.parametrage
                    ? selectedFacture.parametrage.email
                    : "-"}
                </p>
              </div>

              <div style={{ flex: "1", margin: "5px" }}>
                <p style={{ marginBottom: "10px", fontSize: "16px" }}>
                  <EnvironmentOutlined style={{ marginRight: "5px" }} />
                  {selectedFacture && selectedFacture.parametrage
                    ? selectedFacture.parametrage.adresseEntreprise
                    : "-"}
                  {selectedFacture && selectedFacture.parametrage
                    ? `, ${selectedFacture.parametrage.ville}`
                    : ""}
                  {selectedFacture && selectedFacture.parametrage
                    ? `, ${selectedFacture.parametrage.codePostal}`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        }
        width={920} // Augmentation de la largeur de la modal
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "Poppins",
          }}
        >
          <div>
            <div style={{ marginTop: 10 }}>
              <img
                src={Logo}
                alt="Visto Logo"
                style={{ marginBottom: 20, maxWidth: "30%", height: "auto" }}
              />
            </div>

            <div style={{ textAlign: "center", marginLeft: 300 }}>
              <p
                style={{ fontSize: 20, marginBottom: 10, textAlign: "center" }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: 24,
                    color: "#14149f",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    borderBottom: "2px solid #0a0a85",
                    paddingBottom: "4px",
                  }}
                >
                  {selectedFacture ? selectedFacture.numeroFacture : "-"}
                </span>
              </p>
            </div>

            <p style={{ fontSize: 16, marginBottom: 8 }}>
              <span style={{ fontWeight: "bold", color: "#302c2c" }}>
                Date:{" "}
              </span>
              <span style={{ fontSize: 16 }}>
                {selectedFacture ? formatDate(selectedFacture.date) : "-"}
              </span>
            </p>

            <p style={{ fontSize: 14, marginBottom: 8 }}>
              <span
                style={{
                  fontWeight: "bold",
                  color: "#302c2c",
                }}
              >
                Nom de l&apos;entreprise:{" "}
              </span>
              <span style={{ color: "#302c2c", textTransform: "uppercase" }}>
                {selectedFacture && selectedFacture.parametrage
                  ? selectedFacture.parametrage.nomEntreprise.toUpperCase()
                  : "-"}
              </span>
            </p>

            <p style={{ fontSize: 14, marginBottom: 8 }}>
              <span style={{ fontWeight: "bold" }}>Numéro de téléphone: </span>
              {selectedFacture && selectedFacture.parametrage
                ? selectedFacture.parametrage.phonenumber
                : "-"}
            </p>
            <div style={{ flex: "1", margin: "5px", marginLeft: "-5px" }}>
              <p style={{ marginBottom: "10px", fontSize: "14px" }}>
                {selectedFacture && selectedFacture.parametrage
                  ? selectedFacture.parametrage.adresseEntreprise
                  : "-"}
                {selectedFacture && selectedFacture.parametrage
                  ? `, ${selectedFacture.parametrage.ville}`
                  : ""}
                {selectedFacture && selectedFacture.parametrage
                  ? `, ${selectedFacture.parametrage.codePostal}`
                  : ""}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 150 }}>
            {selectedFacture &&
              selectedFacture.client &&
              selectedFacture.client.matriculeFiscale && (
                <p style={{ fontSize: 14, marginBottom: 8 }}>
                  <span style={{ fontWeight: "bold" }}>
                    Matricule Fiscale:{" "}
                  </span>
                  {selectedFacture.client.matriculeFiscale}
                </p>
              )}
            <p style={{ fontSize: 14, marginBottom: 8 }}>
              <span style={{ fontWeight: "bold" }}>Client: </span>
              {selectedFacture && selectedFacture.client
                ? selectedFacture.client.name
                : "-"}
            </p>
            <p style={{ fontSize: 14, marginBottom: 8 }}>
              <span style={{ fontWeight: "bold" }}>Entreprise: </span>
              {selectedFacture && selectedFacture.client
                ? selectedFacture.client.namecompany.toUpperCase()
                : "-"}
            </p>
            <p style={{ fontSize: 14, marginBottom: 8 }}>
              <span style={{ fontWeight: "bold" }}>Email: </span>
              {selectedFacture && selectedFacture.client
                ? selectedFacture.client.email
                : "-"}
            </p>

            <p style={{ fontSize: 14, marginBottom: 8 }}>
              <span style={{ fontWeight: "bold" }}>Numéro de téléphone: </span>
              {selectedFacture && selectedFacture.client
                ? selectedFacture.client.phonenumber
                : "-"}
            </p>
          </div>
        </div>
        <div className="table-container" style={{ marginTop: 20 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #ddd",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    borderRight: "1px solid #ddd",
                    borderBottom: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  Référence
                </th>
                <th
                  style={{
                    borderRight: "1px solid #ddd",
                    borderBottom: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  Désignation
                </th>
                <th
                  style={{
                    borderRight: "1px solid #ddd",
                    borderBottom: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  TVA
                </th>
                <th
                  style={{
                    borderRight: "1px solid #ddd",
                    borderBottom: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  Quantité
                </th>
                <th
                  style={{
                    borderRight: "1px solid #ddd",
                    borderBottom: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  Prix unitaire
                </th>
                <th
                  style={{
                    borderRight: "1px solid #ddd",
                    borderBottom: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  Remise (%)
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  Montant HT
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedFacture &&
                selectedFacture.services &&
                selectedFacture.services.map((service, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {service.reference}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {service.libelle}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {service.tva && service.tva.rate
                        ? `${service.tva.rate}%`
                        : "-"}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {service.quantite}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {service.prix_unitaire.toFixed(3)}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {service.remise}%
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {service.montant_ht.toFixed(3)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "Poppins",
              alignItems: "center", // Pour aligner les éléments verticalement
              flexWrap: "wrap", // Pour que les éléments suivent à la ligne si nécessaire
            }}
          >
            <div style={{ flex: "1 1 100%" }}>
              <p
                style={{
                  fontSize: 14, // Réduction de la taille du texte
                  marginBottom: 4, // Réduction de l'espacement après le paragraphe
                  fontWeight: "bold",
                  color: "#302c2c",
                  marginTop: 10,
                  whiteSpace: "pre-wrap", // Permet aux espaces et aux retours à la ligne de s'afficher correctement
                }}
              >
                <span style={{ fontWeight: "bold", color: "#302c2c" }}>
                  Arrêtée la présente facture à la somme de{" "}
                </span>
                <br /> {/* Retour à la ligne */}
                <span style={{ fontSize: 14 }}>
                  {selectedFacture ? selectedFacture.totalTTCLettre : "-"}
                </span>
                {selectedFacture && selectedFacture.devise && (
                  <span style={{ marginLeft: 5 }}>
                    {selectedFacture.devise.name}
                  </span>
                )}
              </p>
            </div>

            <div
              style={{
                flex: "1 1 100%",
                maxWidth: "300px",
                marginLeft: 550,
                marginTop: -59,
              }}
            >
              <table
                className="facture-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid #ddd",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      Total HT
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {selectedFacture
                        ? selectedFacture.totalHT.toFixed(3)
                        : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      Remise
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {selectedFacture
                        ? selectedFacture.totalRemise.toFixed(3)
                        : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      Total HT après Remise
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {selectedFacture
                        ? selectedFacture.totalHTApresRemise.toFixed(3)
                        : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      Total TVA
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {selectedFacture
                        ? selectedFacture.totalTVA.toFixed(3)
                        : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      Timbre Fiscal
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {selectedFacture && selectedFacture.timbre
                        ? selectedFacture.timbre.value.toFixed(3)
                        : "0"}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        borderRight: "1px solid #ddd",
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      Total TTC
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {selectedFacture
                        ? selectedFacture.totalTTC.toFixed(3)
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        visible={isPrintModalVisible}
        onCancel={handlePrintModalCancel}
        footer={
          <PDFDownloadLink
            document={
              <Document>
                <Page size="A4" style={styles.page}>
                  <View style={styles.section}>
                    <Image src={Logo} style={styles.logo} />
                    <Text style={styles.title}>
                      {selectedFacture ? selectedFacture.numeroFacture : "-"}
                    </Text>
                    <Text style={styles.subtitle}>
                      Date:{" "}
                      {selectedFacture ? formatDate(selectedFacture.date) : "-"}
                    </Text>
                    <Text style={styles.subtitle}>
                      M.F:{" "}
                      {selectedFacture?.parametrage?.matriculefiscal || "-"}
                    </Text>
                    <Text style={styles.subtitle}>
                      Entreprise:{" "}
                      {selectedFacture?.parametrage?.nomEntreprise?.toUpperCase() ||
                        "-"}
                    </Text>
                    <Text style={styles.subtitle}>
                      Tél: {selectedFacture?.parametrage?.phonenumber || "-"}
                    </Text>
                    <Text style={styles.subtitle}>
                      {selectedFacture?.parametrage
                        ? `${selectedFacture.parametrage.adresseEntreprise}, ${selectedFacture.parametrage.ville}, ${selectedFacture.parametrage.codePostal}`
                        : "-"}
                    </Text>
                  </View>
                  {/* Informations du client à droite */}
                  <View style={styles.section}>
                    <View style={{ marginTop: -70, marginLeft: 375 }}>
                      {selectedFacture?.client?.matriculeFiscale && (
                        <Text style={styles.subtitle}>
                          Matricule Fiscale:{" "}
                          {selectedFacture.client.matriculeFiscale}
                        </Text>
                      )}
                      <Text style={styles.subtitle}>
                        Client: {selectedFacture?.client?.name || "-"}
                      </Text>
                      <Text style={styles.subtitle}>
                        Entreprise:{" "}
                        {selectedFacture?.client?.namecompany?.toUpperCase() ||
                          "-"}
                      </Text>
                      <Text style={styles.subtitle}>
                        Email: {selectedFacture?.client?.email || "-"}
                      </Text>
                      <Text style={styles.subtitle}>
                        Tél: {selectedFacture?.client?.phonenumber || "-"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.table}>
                    <View style={styles.tableRow}>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Référence</Text>
                      </View>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Désignation</Text>
                      </View>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>TVA</Text>
                      </View>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Quantité</Text>
                      </View>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>
                          Prix unitaire
                        </Text>
                      </View>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Remise (%)</Text>
                      </View>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Montant HT</Text>
                      </View>
                    </View>

                    {selectedFacture &&
                      selectedFacture.services &&
                      selectedFacture.services.map((service, index) => (
                        <View style={styles.tableRow} key={index}>
                          <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>
                              {service.reference}
                            </Text>
                          </View>
                          <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>
                              {service.libelle}
                            </Text>
                          </View>
                          <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>
                              {service.tva && service.tva.rate
                                ? `${service.tva.rate}%`
                                : "-"}
                            </Text>
                          </View>
                          <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>
                              {service.quantite}
                            </Text>
                          </View>
                          <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>
                              {service.prix_unitaire.toFixed(3)}
                            </Text>
                          </View>
                          <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>
                              {service.remise}%
                            </Text>
                          </View>
                          <View style={styles.tableCol}>
                            <Text style={styles.tableCell}>
                              {service.montant_ht.toFixed(3)}
                            </Text>
                          </View>
                        </View>
                      ))}
                  </View>

                  <View style={styles.totalsContainer}>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.totalsText}>
                        Arrêtée la présente facture à la somme de{" "}
                      </Text>
                      <Text style={styles.totalsText}>
                        {selectedFacture ? selectedFacture.totalTTCLettre : "-"}{" "}
                        {selectedFacture &&
                          selectedFacture.devise &&
                          selectedFacture.devise.name}
                      </Text>
                    </View>
                    <View style={styles.totalsRight}>
                      <View style={styles.totalsTable}>
                        <View style={styles.totalsTableRow}>
                          <View style={styles.totalsTableCellHeader}>
                            <Text style={styles.tableCellHeader}>Total HT</Text>
                          </View>
                          <View style={styles.totalsTableCell}>
                            <Text style={styles.tableCell}>
                              {selectedFacture
                                ? selectedFacture.totalHT.toFixed(3)
                                : "-"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.totalsTableRow}>
                          <View style={styles.totalsTableCellHeader}>
                            <Text style={styles.tableCellHeader}>Remise</Text>
                          </View>
                          <View style={styles.totalsTableCell}>
                            <Text style={styles.tableCell}>
                              {selectedFacture
                                ? selectedFacture.totalRemise.toFixed(3)
                                : "-"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.totalsTableRow}>
                          <View style={styles.totalsTableCellHeader}>
                            <Text style={styles.tableCellHeader}>
                              Total HT après Remise
                            </Text>
                          </View>
                          <View style={styles.totalsTableCell}>
                            <Text style={styles.tableCell}>
                              {selectedFacture
                                ? selectedFacture.totalHTApresRemise.toFixed(3)
                                : "-"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.totalsTableRow}>
                          <View style={styles.totalsTableCellHeader}>
                            <Text style={styles.tableCellHeader}>
                              Total TVA
                            </Text>
                          </View>
                          <View style={styles.totalsTableCell}>
                            <Text style={styles.tableCell}>
                              {selectedFacture
                                ? selectedFacture.totalTVA.toFixed(3)
                                : "-"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.totalsTableRow}>
                          <View style={styles.totalsTableCellHeader}>
                            <Text style={styles.tableCellHeader}>
                              Timbre Fiscal
                            </Text>
                          </View>
                          <View style={styles.totalsTableCell}>
                            <Text style={styles.tableCell}>
                              {selectedFacture
                                ? selectedFacture.timbre.value.toFixed(3)
                                : "-"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.totalsTableRow}>
                          <View style={styles.totalsTableCellHeader}>
                            <Text style={styles.tableCellHeader}>
                              Total TTC
                            </Text>
                          </View>
                          <View style={styles.totalsTableCell}>
                            <Text style={styles.tableCell}>
                              {selectedFacture
                                ? selectedFacture.totalTTC.toFixed(3)
                                : "-"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>
                      Tél: {selectedFacture?.parametrage?.phonenumber || "-"} |
                      Email: {selectedFacture?.parametrage?.email || "-"} |
                      Adresse:{" "}
                      {selectedFacture
                        ? `${selectedFacture.parametrage.adresseEntreprise}, ${selectedFacture.parametrage.ville}, ${selectedFacture.parametrage.codePostal}`
                        : "-"}
                    </Text>
                  </View>
                </Page>
              </Document>
            }
            fileName="facture.pdf"
          >
            {({ loading }) =>
              loading ? "Chargement..." : "Télécharger le PDF"
            }
          </PDFDownloadLink>
        }
        width={800}
      >
        <div
          style={{
            textAlign: "center",
            margin: "20px auto",
            maxWidth: "600px",
          }}
        >
          {selectedFacture && (
            <>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                Numéro de facture : {selectedFacture.numeroFacture}
              </p>
              {/* Ajoutez d'autres détails de la facture ici si nécessaire */}
              <p style={{ fontSize: "18px", marginBottom: "20px" }}>
                Cliquez sur le bouton ci-dessous pour télécharger votre facture
                au format PDF :
              </p>
              {/* Ajoutez votre bouton de téléchargement ici */}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Facture;
