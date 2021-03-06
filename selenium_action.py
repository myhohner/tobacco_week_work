from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException
from tqdm import tqdm
import time,re,os,io,sys
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='gb18030')

class Selenium_action:
    def setUp(self):
        option = webdriver.ChromeOptions()
        #option.add_argument(r'C:\Users\myhoh\AppData\Local\Google\Chrome\User Data')

        extension_path = r'C:\Users\user\Desktop\proxyee\日常\tobaccofreekids_month_work\tobacco_week_work\helper.crx' #根据存放位置修改 
        driver_path=r'C:\Users\user\AppData\Local\Google\Chrome\Application\chromedriver.exe'
        option.add_extension(extension_path)#先保证浏览器正确安装扩展
        #option.add_argument(r'--user-data-dir=C:\Users\myhoh\AppData\Local\Google\Chrome\User Data')
        self.driver=webdriver.Chrome(driver_path,options=option)

        self.driver.implicitly_wait(30)

        base_url = "http://tobaccofreekids.meihua.info/v2/Login2.aspx?ReturnUrl=%2fAdmin%2fnewsdata.aspx"
        driver = self.driver
        driver.get(base_url)
        driver.find_element_by_id("ctl00_cphContent_Login1_UserName").click()
        driver.find_element_by_id("ctl00_cphContent_Login1_UserName").clear()
        driver.find_element_by_id("ctl00_cphContent_Login1_UserName").send_keys("luke_chen")
        driver.find_element_by_id("ctl00_cphContent_Login1_Password").clear()
        driver.find_element_by_id("ctl00_cphContent_Login1_Password").send_keys("V18GWH")
        driver.find_element_by_id("ctl00_cphContent_Login1_LoginButton").click()
        #driver.find_element_by_id("ctl00_s_news").click()
        #driver.get('http://tobaccofreekids.meihua.info/Admin/searchNews.aspx')

    def is_element_present(self, how, what):
        try:
            self.driver.find_element(by=how, value=what)
        except NoSuchElementException as e: 
            return False
        return True

    #写个方法 
    def crawl(self,title):
        url='http://tobaccofreekids.meihua.info/Admin/searchNews.aspx'
        #title='老河口市烟草专卖局多措并举持续净化市场'
        driver=self.driver
        '''
        js='window.open("http://tobaccofreekids.meihua.info/Admin/searchNews.aspx");'
        driver.execute_script(js)
        time.sleep(3)

        handles = driver.window_handles
        print(handles)
        driver.switch_to.window(handles[-1])
        '''
        try:
            driver.get(url)#打开转载页面
            driver.find_element_by_id("txt_Search").send_keys(title)#添加标题
            sel=driver.find_element_by_tag_name("select")
            Select(sel).select_by_value('3m')#选择转载时间
            driver.find_element_by_id("btn_search").click()#搜索
            time1=time.time()
            time.sleep(10)
            #string=driver.find_element_by_xpath("(//div[contains(@class,'tt')]/label/span)[1]").text 
            while not self.is_element_present(By.XPATH,r"//*[contains(text(),'搜索完成')]"):
                time2=time.time()
                '''
                if time2-time1>120:
                    num='Error'
                    return num 
                    '''
                time.sleep(10)
            string=driver.find_element_by_xpath("(//div[contains(@class,'tt')]/label/span)[1]").text
            if string.replace(' ','')=='':
                string='0'
            res=re.findall('\d+',string)
            num=int(res[0])#转载数字
            #self.driver.close()
        except:
            num='Error'
            return num
        return num

        #driver.get(url)
        #time.sleep(10)

    def get_num_list(self,title_list):
        num_list=[]
        pbar=tqdm(title_list)
        for title in pbar:
            pbar.set_description("Processing %s" % title)
            num=self.crawl(title)
            num_list.append(num)
        '''
        tasks=[self.crawl(title) for title in title_list]
        while tasks:
            finished, unfinished = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            for j in finished:
                num=j.result()
                if num:
                    print(num)
                    num_list.append(num)
                    for task in unfinished:
                        task.cancel()
                    if unfinished:
                        await asyncio.wait(unfinished)
            tasks=unfinished
            '''
        return num_list

    def tearDown(self):
        print('finish')
        self.driver.quit()
