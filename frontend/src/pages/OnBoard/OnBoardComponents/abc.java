private String sendSms(String phone,String content,String dltId) throws Exception {
        logger.info("trying to send sms, phone=="+phone);
        if(!phone.startsWith("91")){
          throw new CustomException("Phone number must be start with 91");
           phone="91"+phone;
        }

        logger.info("phone=="+phone);
        logger.info(content);
        try {
            // Construct data


        	
        	//Arihant Global ----------------------
        	String apiKey = "username=userid.trans&password=APIpassword&dltPrincipalEntityId=XXXXX&from=Header";
            String message = "&text=" + content;
     
            String to = "&to=" + phone;
        	String ending = "&unicode=false&dltContentId="+dltId;
        	
            // Send data
            HttpURLConnection conn = (HttpURLConnection) new URL(smsSendUrl).openConnection();
            String data = apiKey + message + to + ending;
            logger.info("----SMS--------{}",data);
            conn.setDoOutput(true);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Length", Integer.toString(data.length()));
            conn.getOutputStream().write(data.getBytes("UTF-8"));
            final BufferedReader rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            final StringBuffer stringBuffer = new StringBuffer();
            String line;
            while ((line = rd.readLine()) != null) {
                stringBuffer.append(line);
            }
            rd.close();
            logger.info("=========returning=========");
            logger.info(stringBuffer.toString());
            return stringBuffer.toString();
        } catch (Exception e) {
            System.out.println("Error SMS "+e);
            return "Error "+e;
        }
    }