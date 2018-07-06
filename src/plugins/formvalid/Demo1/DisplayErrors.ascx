<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="DisplayErrors.ascx.cs" Inherits="MergeServerClientErrors.UserControls.DisplayErrors" %>

        <%-- Execute if JS is disabled--%>
        <noscript>
        <%=""%> <!-- Fix Error cs0103 -->
        <% Page.Validate(); MyValidationSummary.Visible = !Page.IsValid; %>
        <asp:PlaceHolder ID="MyValidationSummary" runat="server">
            <section class="alert alert-danger wb-server-error-clear" >
                <h2><%=Resources.Resources.ValidationSummaryTitle %></h2>
                <ul>                    
                    <% int i = 0;
                        foreach (IValidator val in Page.Validators)
                        {
                            if (!val.IsValid)
                            {
                                String fieldName = "";
                                MyValidationSummary.Visible = true;
                                i += 1;
                                if (val.GetType().Equals(typeof(RequiredFieldValidator)))
                                {
                                    RequiredFieldValidator valRFV = (RequiredFieldValidator)val;
                                    if (!string.IsNullOrEmpty(valRFV.Attributes["data-fieldname-id"]))
                                    {
                                        fieldName = valRFV.Attributes["data-fieldname-id"] + " - ";
                                    }%>
                                    <li><a href="#<%= valRFV.Attributes["data-element-id"] %>"><span class='prefix'><%=Resources.Resources.Error%>&nbsp;<%= i%>: </span><%= fieldName %><%= val.ErrorMessage%> - <%=Resources.Resources.CorrectAndResubmit%></a></li>
                              <%}
                                  else if (val.GetType().Equals(typeof(CustomValidator)))
                                  {
                                    CustomValidator valCV = (CustomValidator)val;
                                    if (!string.IsNullOrEmpty(valCV.Attributes["data-fieldname-id"]))
                                    {
                                        fieldName = valCV.Attributes["data-fieldname-id"] + " - ";
                                    }%>
                                    <li><a href="#<%= valCV.Attributes["data-element-id"] %>"><span class='prefix'><%=Resources.Resources.Error%>&nbsp;<%= i%>: </span><%= fieldName %><%= val.ErrorMessage%> - <%=Resources.Resources.CorrectAndResubmit%></a></li>
                                <%}
                                  val.ErrorMessage = "<span class='prefix'>" + Resources.Resources.Error + " " + i + ": </span>" + val.ErrorMessage;
                            }
                        }%>                    
                </ul>
            </section>
        </asp:PlaceHolder>
        </noscript>
