using System;
using System.Collections.Generic;
using GoC.WebTemplate;
using System.Web.UI.WebControls;
using MergeServerClientErrors.App_GlobalResources;

namespace MergeServerClientErrors.Pages
{
    public partial class Demo1 : BasePage //System.Web.UI.Page
    {
        private void Page_Init(object sender, EventArgs e)
        {
            //Common CSS to WET in the Header
            //We load CSS in case Javascript is disabled.
            WebTemplateMaster.WebTemplateCore.HTMLHeaderElements.Add("<link rel='stylesheet' type='text/css' href='" + ResolveClientUrl("~/Styles/wb-server-error.css") + "'>");
            //WebTemplateMaster.WebTemplateCore.HTMLHeaderElements.Add("<link rel='stylesheet' type='text/css' href='" + ResolveClientUrl("http://localhost/Wet-Boew/theme-wet-boew/css/theme.css") + "'>");

            //Common JS to WET in the body
            //WebTemplateMaster.WebTemplateCore.HTMLBodyElements.Add("<script type='text/javascript' src='" + ResolveClientUrl("~/Scripts/Common/Common.js") + "'></script>");
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            #region Wet Configuration
            WebTemplateMaster.WebTemplateCore.ApplicationTitle.Text = Resources.ApplicationTitle;
            WebTemplateMaster.WebTemplateCore.ApplicationTitle.Href = ResolveClientUrl("http://wet-boew.github.io/wet-boew/index-en.html");
            WebTemplateMaster.WebTemplateCore.HeaderTitle = Resources.HeaderTitle;
            WebTemplateMaster.WebTemplateCore.ContactLink = new Link() { Href = "https://www.canada.ca/en.html" };
            WebTemplateMaster.WebTemplateCore.ScreenIdentifier = "0001";
            WebTemplateMaster.WebTemplateCore.DateModified = Convert.ToDateTime("2018-04-01");
            WebTemplateMaster.WebTemplateCore.ShowSignInLink = true;
            WebTemplateMaster.WebTemplateCore.SignInLinkURL = "about:blank";
            WebTemplateMaster.WebTemplateCore.AppSettingsURL = "http://tempuri.com";
            WebTemplateMaster.WebTemplateCore.FeedbackLinkURL = "https://wet-boew.github.io/v4.0-ci/demos/feedback/feedback-en.html";

            //Language
            WebTemplateMaster.WebTemplateCore.ShowLanguageLink = true;
            if (WebTemplateMaster.WebTemplateCore.TwoLetterCultureLanguage == "en")
            {
                WebTemplateMaster.WebTemplateCore.LanguageLink.Href = "Demo1.aspx?GoCTemplateCulture=fr-CA";
            }
            else
            {
                WebTemplateMaster.WebTemplateCore.LanguageLink.Href = "Demo1.aspx?GoCTemplateCulture=en-CA";
            }

            //Breadcrumbs
            WebTemplateMaster.WebTemplateCore.Breadcrumbs = new List<Breadcrumb>
                {
                    new Breadcrumb{ Href = "https://www.canada.ca/en.html", Title =  Resources.BreadCrumbTitle1, Acronym =  Resources.BreadCrumbAcronym1 },
                    new Breadcrumb { Title = Resources.ApplicationTitle }
                };

            //FooterLinks
            WebTemplateMaster.WebTemplateCore.CustomFooterLinks = new List<FooterLink>
                {
                    new FooterLink
                    {
                        Href = "about:blank",
                        NewWindow = true,
                        Text = Resources.FooterLink1
                    }
                };
            #endregion

            //To bind data-fieldname-id and RequiredFieldValidator.enabled
            DataBind();
        }

        #region Validation

        protected void TypeOfPrestationCvServer(Object source, ServerValidateEventArgs args)
        {
            args.IsValid = (args.Value == "ChildrenHelp" ||
                            args.Value == "Retirement" ||
                            args.Value == "Invalidity");
        }

        protected void BeneficiaryNameCvServer(Object source, ServerValidateEventArgs args)
        {
            args.IsValid = (args.Value.ToUpper().StartsWith("SUPER"));
        }

        protected void BeneficiaryAgeCvServer(Object source, ServerValidateEventArgs args)
        {
            args.IsValid = false;
            try
            {
                int intValue = Int32.Parse(args.Value);
                switch (TypeOfPrestation.SelectedValue)
                {
                    case "ChildrenHelp":
                        if (intValue > 0 && intValue < 19) 
                            args.IsValid=true;
                        else
                            BeneficiaryAgeCv.ErrorMessage = Resources.BeneficiaryAgeCvChildrenHelp;                        
                        break;

                    case "Retirement":
                        if (intValue > 64 && intValue < 201)
                            args.IsValid = true;
                        else
                            BeneficiaryAgeCv.ErrorMessage = Resources.BeneficiaryAgeCvRetirement;
                        break;

                    case "Invalidity":
                        if (intValue > 0 && intValue < 65)
                            args.IsValid = true;
                        else
                            BeneficiaryAgeCv.ErrorMessage = Resources.BeneficiaryAgeCvInvalidity;
                        break;
                }                
            }
            catch (Exception)
            {
                args.IsValid = false;
                BeneficiaryAgeCv.ErrorMessage = Resources.BeneficiaryAgeCvUnexpected;
            }
        
            #endregion
        }
    }
}
