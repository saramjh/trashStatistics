import { useEffect, useState } from "react"
import axios from "axios"
import styles from "../src/App.css"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend)

function App() {
	const [localInfos, setLocalInfos] = useState([])
	const [householdWaste, setHouseholdWaste] = useState([])
	const [budget, setBudget] = useState([])
	const [standard, setStandard] = useState([])
	const [selector, setSelector] = useState("전국")
	const [amount, setAmount] = useState([])
	const [wholeAmount, setWholeAmount] = useState([])
	const [pop, setPop] = useState([])
	const [recycle, setRecycles] = useState([])

	const getData = () => {
		axios.get("/json/locationInfo.json").then((res) => setLocalInfos(res.data.data))
		axios.get("/json/locationInfo.json").then((res) => setStandard(res.data.result))
		axios.get("/json/householdWaste.json").then((res) => setHouseholdWaste(res.data.data))
		axios.get("/json/budget.json").then((res) => setBudget(res.data.data))
	}
	const handlerSelector = (event) => {
		const value = event.target.value
		setSelector(value)
		event.target.disabled = true
	}
	const wasteAmount = async () => {
		const amount = await householdWaste
			.filter((waste) => waste.CITY_JIDT_CD_NM === selector)
			.reduce((acc, cur) => {
				return acc + cur.WSTE_QTY
			}, 0)
		setAmount(amount)
	}
	const budgetAmount = async () => {
		const amount = await budget.filter((budget) => budget.CITY_JIDT_CD_NM === selector)
		setBudget(amount)
	}

	const recycleAmount = async () => {
		const amount = await householdWaste
			.filter((waste) => waste.CITY_JIDT_CD_NM === selector && waste.WT_TYPE_GB_NM === "\r재활용 \r가능자원\r 분리배출")
			.reduce((acc, cur) => {
				return acc + cur.WSTE_QTY
			}, 0)
		setRecycles(amount)
	}

	const wholeWasteAmount = async () => {
		const amount = await householdWaste
			.filter((waste) => waste.CITY_JIDT_CD_NM === "전국")
			.reduce((acc, cur) => {
				return acc + cur.WSTE_QTY
			}, 0)
		setWholeAmount(amount)
	}

	const population = async () => {
		const population = await localInfos.filter((pop) => pop.CITY_JIDT_CD_NM === selector)
		setPop(population)
	}

	useEffect(() => {
		getData()
	}, [])
	useEffect(() => {
		wasteAmount()
		population()
		wholeWasteAmount()
		recycleAmount()
		budgetAmount()
	}, [selector])

	const handlerBtn = () => {
		window.location.replace("/")
	}
	const localPopulation = pop.map((e) => e.TOT_POP)
	const baseYear = standard.map((e) => e.YEAR)
	const ratioRecycle = recycle / (amount - recycle)
	const localTrash = (amount / wholeAmount) * 100
	return (
		<div className="container">
			<div className="selectBox">
				<div className="logo">
					<a href="https://www.blisgo.com">
						<img src="img/logo.png" alt="logo"></img>
					</a>
				</div>
				<select onChange={handlerSelector}>
					{localInfos.map((localInfo, index) => (
						<option key={index} value={localInfo.CITY_JIDT_CD_NM}>
							{localInfo.CITY_JIDT_CD_NM}
						</option>
					))}
				</select>
				<div className="space"></div>
			</div>
			<hr />
			<div className="title">
				<h1>우리 지역은 쓰레기 얼마나 버리고 있을까요?</h1>
			</div>
			<hr />
			<div className="meassage">
				{selector !== "전국" ? (
					<div className="statistics">
						<h3>이 통계는 {baseYear}년 기준의 자료에요.</h3>
						<div className="firstDiv">
							<Doughnut
								options={{
									responsive: false,
								}}
								data={{
									labels: ["전국", selector],
									datasets: [
										{
											label: `폐기물 배출량`,
											data: [100 - localTrash, localTrash],
											backgroundColor: ["#015f27", "#6bb89c"],
										},
									],
								}}
								style={{
									width: "300px",
									margin: "auto",
									marginBottom: "20px",
									paddingBottom: "20px",
									backgroundColor: "white",
									borderRadius: "10px",
								}}
							/>
							<strong>{selector}</strong> 지역에서 발생한 폐기물은 <br />
							연간 <strong>{amount.toFixed(0)}톤</strong>으로
							<br />
							전국 배출량 중 <strong>{((amount / wholeAmount) * 100).toFixed(1)}%</strong>에 달하는 양입니다.
						</div>
						<div className="secondDiv">
							<div className="recycleLogo">
								<img src="img/recycle.png" alt="recycle"></img>
							</div>
							<br />
							<strong>{selector}</strong> 인구{" "}
							<strong>
								{pop
									.map((e) => e.TOT_POP)
									.toString()
									.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
								명
							</strong>
							을 기준으로 나누면
							<br />
							4인 가구 평균 약 <strong>{((amount * 1000) / localPopulation).toFixed(1) * 4}kg</strong>을 배출하였다는 계산으로
							<br />
							이중 <strong>{(ratioRecycle * 100).toFixed(1)}%</strong>만큼만 재활용이 되었다고합니다.
						</div>
						<div className="thirdDiv">
							<div className="wasteGif">
								<img src="img/waste.gif" alt="waste"></img>
							</div>
							즉 <strong>{100 - (ratioRecycle * 100).toFixed(1)}%</strong>에 해당하는 <strong>{((amount * (100 - ratioRecycle * 100)) / 100).toFixed(0)}톤</strong>의 쓰레기는
							<br />
							매립되거나 소각되어 다시쓰지 못하고 버려진다거죠.
							<br />
						</div>
						<div className="fourthDiv">
							<strong>{selector}</strong> 지역의 생활폐기물 처리예산은 국비와 지방비를 합쳐
							<br />
							연간{" "}
							<strong>
								{budget
									.map((e) => e.TOT_AMT * 1000)
									.toString()
									.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
								원
							</strong>
							으로
							<br />
							4인 가구 기준{" "}
							<strong>
								{(budget.map((e) => e.TOT_AMT * 1000) / (localPopulation / 4))
									.toFixed(0)
									.toString()
									.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
								원
							</strong>
							을 지출한 셈이 됩니다. <br />
							<div className="nuggets">
								<img src="img/nuggets.gif" alt="nuggets"></img>
							</div>
							무려 뿌링클 순살을 1년에 <strong>{(budget.map((e) => e.TOT_AMT * 1000) / (localPopulation / 4) / 20000).toFixed(0)}</strong>마리나 사먹을 수 있는 돈이죠!
						</div>
						<div className="footer">
							이렇게나 많은 쓰레기가 만들어져
							<br />
							버려지고 있었다는 사실,
							<br />
							<br />
							놀랍지 않나요?
						</div>
					</div>
				) : (
					""
				)}
			</div>
			<button onClick={handlerBtn}>다른 도시 알아보기</button>
		</div>
	)
}

export default App
