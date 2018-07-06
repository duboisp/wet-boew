<%@ Page Language="C#" AutoEventWireup="true" MasterPageFile="~/GoC.WebTemplate/GoCWebTemplate.Application.Local.Master"
    CodeBehind="Demo1.aspx.cs" Inherits="MergeServerClientErrors.Pages.Demo1"  %>

<%@ Register TagPrefix="uc" TagName="DisplayErrors" Src="~/UserControls/DisplayErrors.ascx" %>

<asp:Content ID="Content1" ContentPlaceHolderID="MainContent" runat="server">

<%--If Jquery is down--%>
<%--<script src= "https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>--%>

<h1 id="wb-cont">
    <asp:Label ID="lblTitle" property="name" Text="<%$ Resources: Resources, Title %>" runat="server"></asp:Label>    
</h1>

<div class="wb-frmvld">
<form id="frmMain" runat="server">   
           
    <uc:DisplayErrors runat="server" />

    <asp:PlaceHolder ID="phdEnterInfo" runat="server" Visible="true">
         <section class="panel panel-info">
            <header class="panel-heading">
                <h2 class="panel-title">
                    <asp:Literal Text="Section 1" runat="server"></asp:Literal>
                </h2>
            </header>            
            <div class="panel-body">
                
                <div class="form-group">      
                    <asp:Label AssociatedControlID="TypeOfPrestation" class="css-star" runat="server">                               
                        <abbr title="">                            
                            <asp:Label ID="TypeOfPrestationLbl" Text="<%$ Resources: Resources, TypeOfPrestationLbl %>" ToolTip="<%$ Resources: Resources, TypeOfPrestationTT %>" Class="field-name" runat="server"></asp:Label>
                        </abbr>
                        <strong class="css-required">
                            <asp:Literal Text="<%$ Resources: Resources, RequiredField %>" runat="server"></asp:Literal>
                        </strong>
                        <asp:RequiredFieldValidator ID="TypeOfPrestationRfv"  ErrorMessage = "<%$ Resources: Resources, TypeOfPrestationRfv %>" ControlToValidate="TypeOfPrestation" Enabled="<%#Page.IsPostBack%>" data-fieldname-id="<%#TypeOfPrestationLbl.Text%>"
                                                    Display="Dynamic" EnableClientScript="false" data-element-id="MainContent_TypeOfPrestation" CssClass="label label-danger wb-server-error" runat="server"></asp:RequiredFieldValidator>

                        <asp:CustomValidator        ID="TypeOfPrestationCv" ErrorMessage = "<%$ Resources: Resources, TypeOfPrestationCv %>" ControlToValidate="TypeOfPrestation" OnServerValidate="TypeOfPrestationCvServer" data-fieldname-id="<%#TypeOfPrestationLbl.Text%>"
                                                    Display="Dynamic" EnableClientScript="false" data-element-id="MainContent_TypeOfPrestation" Cssclass="label label-danger wb-server-error" runat="server"></asp:CustomValidator>
                    </asp:Label>                        
                    <div>
                        <asp:DropDownList id="TypeOfPrestation" required="required" runat="server">                           
                            <asp:ListItem Text="<%$ Resources: Resources, SelectAPrestation %>" Value="" />
                            <asp:ListItem Text="<%$ Resources: Resources, ChildrenHelp  %>" Value="ChildrenHelp" />
                            <asp:ListItem Text="<%$ Resources: Resources, Invalidity %>" Value="Invalidity" />
                            <asp:ListItem Text="<%$ Resources: Resources, Retirement %>" Value="Retirement" />                           
                        </asp:DropDownList>  
                    </div>
                </div>

                <fieldset>
                <legend><%=Resources.Resources.BeneficiaryLegend %></legend>

                    <div class="form-group">
                        <asp:Label AssociatedControlID="BeneficiaryName" class="css-star" runat="server">                               
                            <abbr title="">                            
                                <asp:Label ID="BeneficiaryNameLbl" Text="<%$ Resources: Resources, BeneficiaryNameLbl %>" ToolTip="<%$ Resources: Resources, BeneficiaryNameTT %>"  Class="field-name" runat="server"></asp:Label>
                            </abbr>
                            <strong class="css-required">
                                <asp:Literal Text="<%$ Resources: Resources, RequiredField %>" runat="server"></asp:Literal>
                            </strong>
                            <asp:RequiredFieldValidator ID="BeneficiaryNameRfv" ErrorMessage = "<%$ Resources: Resources, BeneficiaryNameRfv %>" ControlToValidate="BeneficiaryName" Enabled="<%#Page.IsPostBack%>" data-fieldname-id="<%#BeneficiaryNameLbl.Text%>"
                                                        Display="Dynamic" EnableClientScript="false" data-element-id="MainContent_BeneficiaryName" CssClass="label label-danger wb-server-error" runat="server"></asp:RequiredFieldValidator>

                            <asp:CustomValidator        ID="BeneficiaryNameCv" ErrorMessage = "<%$ Resources: Resources, BeneficiaryNameCv %>" ControlToValidate="BeneficiaryName" OnServerValidate="BeneficiaryNameCvServer" data-fieldname-id="<%#BeneficiaryNameLbl.Text%>"
                                                        Display="Dynamic" EnableClientScript="false" data-element-id="MainContent_BeneficiaryName" CssClass="label label-danger wb-server-error" runat="server"></asp:CustomValidator>
                        </asp:Label>                    
                        <asp:TextBox ID="BeneficiaryName" required="required" MaxLength="16" class="form-control" runat="server"></asp:TextBox>                    
                    </div>

                    <div class="form-group">
                        <asp:Label AssociatedControlID="BeneficiaryAge" class="css-star" runat="server">                               
                            <abbr title="">                            
                                <asp:Label ID="BeneficiaryAgeLbl" Text="<%$ Resources: Resources, BeneficiaryAgeLbl %>" ToolTip="<%$ Resources: Resources, BeneficiaryAgeTT %>"  Class="field-name" runat="server"></asp:Label>
                            </abbr>
                            <strong class="css-required">
                                <asp:Literal Text="<%$ Resources: Resources, RequiredField %>" runat="server"></asp:Literal>
                            </strong>
                            <asp:RequiredFieldValidator ID="BeneficiaryAgeRfv" ErrorMessage = "<%$ Resources: Resources, BeneficiaryAgeRfv %>" ControlToValidate="BeneficiaryAge" Enabled="<%#Page.IsPostBack%>" data-fieldname-id="<%#BeneficiaryAgeLbl.Text%>"
                                                        Display="Dynamic" EnableClientScript="false" data-element-id="MainContent_BeneficiaryAge" CssClass="label label-danger wb-server-error" runat="server"></asp:RequiredFieldValidator>

                            <asp:CustomValidator        ID="BeneficiaryAgeCv" ErrorMessage = "<%$ Resources: Resources, BeneficiaryAgeCv %>" ControlToValidate="BeneficiaryAge" OnServerValidate="BeneficiaryAgeCvServer" data-fieldname-id="<%#BeneficiaryAgeLbl.Text%>"
                                                        Display="Dynamic" EnableClientScript="false" data-element-id="MainContent_BeneficiaryAge" CssClass="label label-danger wb-server-error" runat="server"></asp:CustomValidator>
                        </asp:Label>                    
                        <asp:TextBox ID="BeneficiaryAge" required="required" class="form-control" type="number" min="1" max="200" step="1" runat="server"></asp:TextBox>                    
                    </div>
                    
                </fieldset>
                
                <ul class="list-inline">
                    <li><asp:Button ID="btnSubmit" Text="<%$ Resources: Resources, btnSubmit %>" class="btn btn-primary" runat="server"></asp:Button></li>                    
                    <%--<li><asp:Button ID="btnReset" Text="<%$ Resources: Resources, btnReset %>" OnClientClick="location.reload(true);" class="btn btn-default" runat="server"></asp:Button></li>--%>                    
                </ul>

            </div>                  
        </section>
    </asp:PlaceHolder>
    
</form>
</div>
</asp:Content>
